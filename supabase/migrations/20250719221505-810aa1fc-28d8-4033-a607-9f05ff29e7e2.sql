
-- Update the existing submission for test141@gmail.com with correct calculated values
-- Based on the temporary submission data we found earlier
UPDATE public.submissions 
SET 
  total_leak = 22000000,
  recovery_potential_70 = 15400000,
  recovery_potential_85 = 18700000,
  lead_response_loss = 21800000,
  failed_payment_loss = 200000,
  selfserve_gap_loss = 0,
  process_inefficiency_loss = 0,
  lead_score = 83,
  leak_percentage = 44.0,
  updated_at = NOW()
WHERE id = '430894a7-ae67-42f6-8761-18fe29a5236f'
AND contact_email = 'test141@gmail.com';

-- Verify the update worked
SELECT 
  id,
  company_name,
  contact_email,
  total_leak,
  recovery_potential_70,
  lead_score,
  updated_at
FROM public.submissions 
WHERE contact_email = 'test141@gmail.com';
