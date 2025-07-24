-- Add additional missing columns to fix save functionality

-- Add first_submission_date column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_submission_date timestamp with time zone DEFAULT NULL;

-- Add converted_to_user_id column to temporary_submissions table  
ALTER TABLE public.temporary_submissions 
ADD COLUMN converted_to_user_id uuid DEFAULT NULL;