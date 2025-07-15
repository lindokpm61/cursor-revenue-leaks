-- Phase 1: Core Calculation Integrity - Database Constraints and Validation

-- Add validation triggers to ensure data integrity
CREATE OR REPLACE FUNCTION validate_submission_bounds()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate ARR bounds
  IF NEW.current_arr IS NOT NULL AND NEW.current_arr < 0 THEN
    RAISE EXCEPTION 'Current ARR cannot be negative';
  END IF;
  
  -- Validate lead response loss bounds (max 30% of ARR)
  IF NEW.lead_response_loss IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.lead_response_loss > NEW.current_arr * 0.3 THEN
      NEW.lead_response_loss = NEW.current_arr * 0.3;
    END IF;
  END IF;
  
  -- Validate self-serve gap loss bounds (max 50% of ARR)
  IF NEW.selfserve_gap_loss IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.selfserve_gap_loss > NEW.current_arr * 0.5 THEN
      NEW.selfserve_gap_loss = NEW.current_arr * 0.5;
    END IF;
  END IF;
  
  -- Validate total leak bounds (max 150% of ARR)
  IF NEW.total_leak IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.total_leak > NEW.current_arr * 1.5 THEN
      NEW.total_leak = NEW.current_arr * 1.5;
    END IF;
  END IF;
  
  -- Validate recovery potential bounds
  IF NEW.recovery_potential_70 IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.recovery_potential_70 > NEW.current_arr * 1.0 THEN
      NEW.recovery_potential_70 = NEW.current_arr * 1.0;
    END IF;
  END IF;
  
  IF NEW.recovery_potential_85 IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.recovery_potential_85 > NEW.current_arr * 1.2 THEN
      NEW.recovery_potential_85 = NEW.current_arr * 1.2;
    END IF;
  END IF;
  
  -- Validate percentage bounds
  IF NEW.leak_percentage IS NOT NULL THEN
    NEW.leak_percentage = LEAST(NEW.leak_percentage, 300); -- Cap at 300%
  END IF;
  
  IF NEW.failed_payment_rate IS NOT NULL THEN
    NEW.failed_payment_rate = LEAST(GREATEST(NEW.failed_payment_rate, 0), 50); -- 0-50%
  END IF;
  
  IF NEW.free_to_paid_conversion IS NOT NULL THEN
    NEW.free_to_paid_conversion = LEAST(GREATEST(NEW.free_to_paid_conversion, 0), 100); -- 0-100%
  END IF;
  
  -- Validate response time bounds
  IF NEW.lead_response_time IS NOT NULL THEN
    NEW.lead_response_time = LEAST(GREATEST(NEW.lead_response_time, 0), 168); -- Max 1 week
  END IF;
  
  -- Validate manual hours bounds
  IF NEW.manual_hours IS NOT NULL THEN
    NEW.manual_hours = LEAST(GREATEST(NEW.manual_hours, 0), 80); -- Max 80 hours/week
  END IF;
  
  -- Validate hourly rate bounds
  IF NEW.hourly_rate IS NOT NULL THEN
    NEW.hourly_rate = LEAST(GREATEST(NEW.hourly_rate, 0), 500); -- Max $500/hour
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for submissions validation
DROP TRIGGER IF EXISTS validate_submission_bounds_trigger ON public.submissions;
CREATE TRIGGER validate_submission_bounds_trigger
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_submission_bounds();

-- Add similar validation for temporary submissions
CREATE OR REPLACE FUNCTION validate_temp_submission_bounds()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract calculator data if it exists
  IF NEW.calculator_data IS NOT NULL THEN
    DECLARE
      current_arr NUMERIC;
      total_leak NUMERIC;
    BEGIN
      -- Extract values from JSONB
      current_arr := COALESCE((NEW.calculator_data->'companyInfo'->>'currentARR')::NUMERIC, 0);
      total_leak := COALESCE(NEW.total_revenue_leak, 0);
      
      -- Validate total revenue leak bounds
      IF total_leak > 0 AND current_arr > 0 AND total_leak > current_arr * 1.5 THEN
        NEW.total_revenue_leak = current_arr * 1.5;
      END IF;
      
      -- Validate recovery potential bounds
      IF NEW.recovery_potential IS NOT NULL AND current_arr > 0 THEN
        IF NEW.recovery_potential > current_arr * 1.0 THEN
          NEW.recovery_potential = current_arr * 1.0;
        END IF;
      END IF;
    END;
  END IF;
  
  -- Validate lead score bounds (0-100)
  IF NEW.lead_score IS NOT NULL THEN
    NEW.lead_score = LEAST(GREATEST(NEW.lead_score, 0), 100);
  END IF;
  
  -- Validate engagement score bounds (0-100)
  IF NEW.email_engagement_score IS NOT NULL THEN
    NEW.email_engagement_score = LEAST(GREATEST(NEW.email_engagement_score, 0), 100);
  END IF;
  
  -- Validate completion percentage bounds (0-100)
  IF NEW.completion_percentage IS NOT NULL THEN
    NEW.completion_percentage = LEAST(GREATEST(NEW.completion_percentage, 0), 100);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for temporary submissions validation
DROP TRIGGER IF EXISTS validate_temp_submission_bounds_trigger ON public.temporary_submissions;
CREATE TRIGGER validate_temp_submission_bounds_trigger
  BEFORE INSERT OR UPDATE ON public.temporary_submissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_temp_submission_bounds();

-- Add indexes for better performance on bounded queries
CREATE INDEX IF NOT EXISTS idx_submissions_arr_bounds ON public.submissions (current_arr, total_leak, recovery_potential_70);
CREATE INDEX IF NOT EXISTS idx_submissions_leak_percentage ON public.submissions (leak_percentage) WHERE leak_percentage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_temp_submissions_bounds ON public.temporary_submissions (total_revenue_leak, recovery_potential) WHERE total_revenue_leak IS NOT NULL;