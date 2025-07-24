-- Add missing phone column to temporary_submissions table
ALTER TABLE temporary_submissions 
ADD COLUMN IF NOT EXISTS phone text;