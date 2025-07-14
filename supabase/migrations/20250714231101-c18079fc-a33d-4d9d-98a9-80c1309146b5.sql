-- Fix existing data first, then add constraints

-- Update columns to NUMERIC type
ALTER TABLE public.submissions 
  ALTER COLUMN lead_response_loss TYPE NUMERIC(15,2),
  ALTER COLUMN failed_payment_loss TYPE NUMERIC(15,2),
  ALTER COLUMN selfserve_gap_loss TYPE NUMERIC(15,2),
  ALTER COLUMN process_inefficiency_loss TYPE NUMERIC(15,2),
  ALTER COLUMN total_leak TYPE NUMERIC(15,2),
  ALTER COLUMN recovery_potential_70 TYPE NUMERIC(15,2),
  ALTER COLUMN recovery_potential_85 TYPE NUMERIC(15,2),
  ALTER COLUMN current_arr TYPE NUMERIC(15,2),
  ALTER COLUMN monthly_mrr TYPE NUMERIC(12,2),
  ALTER COLUMN average_deal_value TYPE NUMERIC(12,2);

-- Clean existing data to meet bounds
UPDATE public.submissions 
SET 
  lead_response_loss = LEAST(COALESCE(lead_response_loss, 0), COALESCE(current_arr, 0) * 0.3),
  selfserve_gap_loss = LEAST(COALESCE(selfserve_gap_loss, 0), COALESCE(current_arr, 0) * 0.5),
  total_leak = LEAST(COALESCE(total_leak, 0), COALESCE(current_arr, 0) * 1.5),
  recovery_potential_70 = LEAST(COALESCE(recovery_potential_70, 0), COALESCE(current_arr, 0) * 1.0),
  recovery_potential_85 = LEAST(COALESCE(recovery_potential_85, 0), COALESCE(current_arr, 0) * 1.2),
  leak_percentage = CASE 
    WHEN current_arr > 0 THEN LEAST(ROUND((COALESCE(total_leak, 0) / current_arr) * 100, 2), 300)
    ELSE 0 
  END,
  updated_at = NOW()
WHERE current_arr IS NOT NULL AND current_arr > 0;