-- Update validation bounds to be more realistic
CREATE OR REPLACE FUNCTION public.validate_submission_bounds()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate ARR bounds
  IF NEW.current_arr IS NOT NULL AND NEW.current_arr < 0 THEN
    RAISE EXCEPTION 'Current ARR cannot be negative';
  END IF;
  
  -- Validate lead response loss bounds (max 15% of ARR)
  IF NEW.lead_response_loss IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.lead_response_loss > NEW.current_arr * 0.15 THEN
      NEW.lead_response_loss = NEW.current_arr * 0.15;
    END IF;
  END IF;
  
  -- Validate self-serve gap loss bounds (max 25% of ARR)
  IF NEW.selfserve_gap_loss IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.selfserve_gap_loss > NEW.current_arr * 0.25 THEN
      NEW.selfserve_gap_loss = NEW.current_arr * 0.25;
    END IF;
  END IF;
  
  -- Validate total leak bounds (max 50% of ARR)
  IF NEW.total_leak IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.total_leak > NEW.current_arr * 0.5 THEN
      NEW.total_leak = NEW.current_arr * 0.5;
    END IF;
  END IF;
  
  -- Validate recovery potential bounds (max 35% of ARR for 70%, max 42% for 85%)
  IF NEW.recovery_potential_70 IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.recovery_potential_70 > NEW.current_arr * 0.35 THEN
      NEW.recovery_potential_70 = NEW.current_arr * 0.35;
    END IF;
  END IF;
  
  IF NEW.recovery_potential_85 IS NOT NULL AND NEW.current_arr IS NOT NULL AND NEW.current_arr > 0 THEN
    IF NEW.recovery_potential_85 > NEW.current_arr * 0.42 THEN
      NEW.recovery_potential_85 = NEW.current_arr * 0.42;
    END IF;
  END IF;
  
  -- Validate percentage bounds (max 100% leak percentage)
  IF NEW.leak_percentage IS NOT NULL THEN
    NEW.leak_percentage = LEAST(NEW.leak_percentage, 100);
  END IF;
  
  IF NEW.failed_payment_rate IS NOT NULL THEN
    NEW.failed_payment_rate = LEAST(GREATEST(NEW.failed_payment_rate, 0), 50);
  END IF;
  
  IF NEW.free_to_paid_conversion IS NOT NULL THEN
    NEW.free_to_paid_conversion = LEAST(GREATEST(NEW.free_to_paid_conversion, 0), 100);
  END IF;
  
  -- Validate response time bounds
  IF NEW.lead_response_time IS NOT NULL THEN
    NEW.lead_response_time = LEAST(GREATEST(NEW.lead_response_time, 0), 168);
  END IF;
  
  -- Validate manual hours bounds
  IF NEW.manual_hours IS NOT NULL THEN
    NEW.manual_hours = LEAST(GREATEST(NEW.manual_hours, 0), 80);
  END IF;
  
  -- Validate hourly rate bounds
  IF NEW.hourly_rate IS NOT NULL THEN
    NEW.hourly_rate = LEAST(GREATEST(NEW.hourly_rate, 0), 500);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix existing data with realistic bounds
UPDATE public.submissions 
SET 
  lead_response_loss = LEAST(COALESCE(lead_response_loss, 0), COALESCE(current_arr, 0) * 0.15),
  selfserve_gap_loss = LEAST(COALESCE(selfserve_gap_loss, 0), COALESCE(current_arr, 0) * 0.25),
  total_leak = LEAST(COALESCE(total_leak, 0), COALESCE(current_arr, 0) * 0.5),
  recovery_potential_70 = LEAST(COALESCE(recovery_potential_70, 0), COALESCE(current_arr, 0) * 0.35),
  recovery_potential_85 = LEAST(COALESCE(recovery_potential_85, 0), COALESCE(current_arr, 0) * 0.42),
  leak_percentage = CASE 
    WHEN current_arr > 0 THEN LEAST(ROUND((COALESCE(total_leak, 0) / current_arr) * 100, 2), 100)
    ELSE 0 
  END,
  updated_at = NOW()
WHERE current_arr IS NOT NULL AND current_arr > 0;