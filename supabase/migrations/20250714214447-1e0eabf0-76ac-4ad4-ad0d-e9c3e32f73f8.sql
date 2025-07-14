-- Phase 3: Database cleanup and constraints for calculation system

-- Update submissions table to use NUMERIC for precision instead of BIGINT
ALTER TABLE public.submissions 
  ALTER COLUMN lead_response_loss TYPE NUMERIC(15,2),
  ALTER COLUMN failed_payment_loss TYPE NUMERIC(15,2),
  ALTER COLUMN selfserve_gap_loss TYPE NUMERIC(15,2),
  ALTER COLUMN process_inefficiency_loss TYPE NUMERIC(15,2),
  ALTER COLUMN total_leak TYPE NUMERIC(15,2),
  ALTER COLUMN recovery_potential_70 TYPE NUMERIC(15,2),
  ALTER COLUMN recovery_potential_85 TYPE NUMERIC(15,2),
  ALTER COLUMN current_arr TYPE NUMERIC(15,2),
  ALTER COLUMN monthly_mrr TYPE NUMERIC(15,2),
  ALTER COLUMN average_deal_value TYPE NUMERIC(12,2);

-- Add check constraints for calculation sanity
ALTER TABLE public.submissions 
  ADD CONSTRAINT check_lead_response_loss_bounds 
    CHECK (lead_response_loss IS NULL OR (lead_response_loss >= 0 AND lead_response_loss <= current_arr * 0.5)),
  ADD CONSTRAINT check_selfserve_gap_bounds 
    CHECK (selfserve_gap_loss IS NULL OR (selfserve_gap_loss >= 0 AND selfserve_gap_loss <= current_arr * 0.5)),
  ADD CONSTRAINT check_total_leak_bounds 
    CHECK (total_leak IS NULL OR (total_leak >= 0 AND total_leak <= current_arr * 1.5)),
  ADD CONSTRAINT check_recovery_potential_bounds 
    CHECK (recovery_potential_70 IS NULL OR (recovery_potential_70 >= 0 AND recovery_potential_70 <= current_arr * 1.2)),
  ADD CONSTRAINT check_positive_values 
    CHECK (current_arr IS NULL OR current_arr >= 0),
  ADD CONSTRAINT check_percentage_bounds 
    CHECK (leak_percentage IS NULL OR (leak_percentage >= 0 AND leak_percentage <= 300)),
  ADD CONSTRAINT check_mrr_consistency 
    CHECK (monthly_mrr IS NULL OR current_arr IS NULL OR ABS((monthly_mrr * 12) - current_arr) <= current_arr * 0.5);

-- Update temporary_submissions table for consistency
ALTER TABLE public.temporary_submissions 
  ALTER COLUMN total_revenue_leak TYPE NUMERIC(15,2),
  ALTER COLUMN recovery_potential TYPE NUMERIC(15,2);

-- Add function to recalculate and validate existing submissions
CREATE OR REPLACE FUNCTION public.validate_and_fix_calculation_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  updated_count INTEGER := 0;
  current_arr_val NUMERIC;
  total_leak_val NUMERIC;
  lead_loss_val NUMERIC;
  selfserve_loss_val NUMERIC;
  recovery_70_val NUMERIC;
  recovery_85_val NUMERIC;
BEGIN
  -- Process each submission and apply bounds
  FOR rec IN SELECT id, current_arr, lead_response_loss, selfserve_gap_loss, 
                    total_leak, recovery_potential_70, recovery_potential_85
             FROM public.submissions 
             WHERE current_arr IS NOT NULL AND current_arr > 0
  LOOP
    current_arr_val := COALESCE(rec.current_arr, 0);
    
    -- Apply bounds to lead response loss (max 30% of ARR)
    lead_loss_val := LEAST(COALESCE(rec.lead_response_loss, 0), current_arr_val * 0.3);
    
    -- Apply bounds to self-serve gap (max 50% of ARR)
    selfserve_loss_val := LEAST(COALESCE(rec.selfserve_gap_loss, 0), current_arr_val * 0.5);
    
    -- Recalculate total leak with bounds (max 150% of ARR)
    total_leak_val := LEAST(
      lead_loss_val + 
      COALESCE(rec.selfserve_gap_loss, 0) + 
      COALESCE((SELECT failed_payment_loss FROM submissions WHERE id = rec.id), 0) + 
      COALESCE((SELECT process_inefficiency_loss FROM submissions WHERE id = rec.id), 0),
      current_arr_val * 1.5
    );
    
    -- Apply bounds to recovery potential
    recovery_70_val := LEAST(total_leak_val * 0.7, current_arr_val * 1.0);
    recovery_85_val := LEAST(total_leak_val * 0.85, current_arr_val * 1.2);
    
    -- Update the record if values changed significantly
    IF ABS(COALESCE(rec.lead_response_loss, 0) - lead_loss_val) > 1000 OR
       ABS(COALESCE(rec.selfserve_gap_loss, 0) - selfserve_loss_val) > 1000 OR
       ABS(COALESCE(rec.total_leak, 0) - total_leak_val) > 1000 OR
       ABS(COALESCE(rec.recovery_potential_70, 0) - recovery_70_val) > 1000 THEN
      
      UPDATE public.submissions 
      SET 
        lead_response_loss = lead_loss_val,
        selfserve_gap_loss = selfserve_loss_val,
        total_leak = total_leak_val,
        recovery_potential_70 = recovery_70_val,
        recovery_potential_85 = recovery_85_val,
        leak_percentage = CASE 
          WHEN current_arr_val > 0 THEN ROUND((total_leak_val / current_arr_val) * 100, 2)
          ELSE 0 
        END,
        updated_at = NOW()
      WHERE id = rec.id;
      
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Create a trigger to validate calculations on insert/update
CREATE OR REPLACE FUNCTION public.validate_submission_calculations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Apply bounds if current_arr exists
  IF NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    -- Cap lead response loss at 30% of ARR
    IF NEW.lead_response_loss IS NOT NULL THEN
      NEW.lead_response_loss := LEAST(NEW.lead_response_loss, NEW.current_arr * 0.3);
    END IF;
    
    -- Cap self-serve gap at 50% of ARR
    IF NEW.selfserve_gap_loss IS NOT NULL THEN
      NEW.selfserve_gap_loss := LEAST(NEW.selfserve_gap_loss, NEW.current_arr * 0.5);
    END IF;
    
    -- Cap total leak at 150% of ARR
    IF NEW.total_leak IS NOT NULL THEN
      NEW.total_leak := LEAST(NEW.total_leak, NEW.current_arr * 1.5);
    END IF;
    
    -- Cap recovery potentials
    IF NEW.recovery_potential_70 IS NOT NULL THEN
      NEW.recovery_potential_70 := LEAST(NEW.recovery_potential_70, NEW.current_arr * 1.0);
    END IF;
    
    IF NEW.recovery_potential_85 IS NOT NULL THEN
      NEW.recovery_potential_85 := LEAST(NEW.recovery_potential_85, NEW.current_arr * 1.2);
    END IF;
    
    -- Recalculate leak percentage
    IF NEW.total_leak IS NOT NULL THEN
      NEW.leak_percentage := ROUND((NEW.total_leak / NEW.current_arr) * 100, 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for submissions table
DROP TRIGGER IF EXISTS validate_calculations_trigger ON public.submissions;
CREATE TRIGGER validate_calculations_trigger
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_submission_calculations();

-- Add index for better performance on calculation queries
CREATE INDEX IF NOT EXISTS idx_submissions_calculation_bounds 
  ON public.submissions (current_arr, total_leak, leak_percentage) 
  WHERE current_arr IS NOT NULL;

-- Create view for calculation health metrics
CREATE OR REPLACE VIEW public.calculation_health_metrics AS
SELECT 
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE total_leak > current_arr * 2) as excessive_leak_count,
  COUNT(*) FILTER (WHERE recovery_potential_70 > current_arr) as excessive_recovery_count,
  COUNT(*) FILTER (WHERE leak_percentage > 200) as high_percentage_count,
  AVG(leak_percentage) as avg_leak_percentage,
  MAX(leak_percentage) as max_leak_percentage
FROM public.submissions 
WHERE current_arr IS NOT NULL AND current_arr > 0;