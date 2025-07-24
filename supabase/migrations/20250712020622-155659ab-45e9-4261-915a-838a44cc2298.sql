-- Add company ID tracking to submissions table
ALTER TABLE public.submissions 
ADD COLUMN twenty_company_id text;