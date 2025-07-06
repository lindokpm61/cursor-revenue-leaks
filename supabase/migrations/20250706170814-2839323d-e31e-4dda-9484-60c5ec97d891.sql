-- Fix numeric precision overflow by updating numeric columns to have sufficient precision
ALTER TABLE public.submissions 
  ALTER COLUMN free_to_paid_conversion TYPE numeric(10,4),
  ALTER COLUMN failed_payment_rate TYPE numeric(10,4),
  ALTER COLUMN leak_percentage TYPE numeric(10,4);