-- Add missing UTM tracking columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text;