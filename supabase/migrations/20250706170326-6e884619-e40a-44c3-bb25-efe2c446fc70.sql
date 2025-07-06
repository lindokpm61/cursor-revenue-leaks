-- Fix numeric field overflow by changing integer columns to bigint
ALTER TABLE public.submissions 
  ALTER COLUMN current_arr TYPE bigint,
  ALTER COLUMN monthly_leads TYPE bigint,
  ALTER COLUMN average_deal_value TYPE bigint,
  ALTER COLUMN lead_response_time TYPE bigint,
  ALTER COLUMN monthly_free_signups TYPE bigint,
  ALTER COLUMN monthly_mrr TYPE bigint,
  ALTER COLUMN manual_hours TYPE bigint,
  ALTER COLUMN hourly_rate TYPE bigint,
  ALTER COLUMN lead_score TYPE bigint;