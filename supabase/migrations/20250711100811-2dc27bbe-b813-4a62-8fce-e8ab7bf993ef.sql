-- Add phone number support to database tables

-- Add phone column to temporary_submissions table
ALTER TABLE public.temporary_submissions 
ADD COLUMN phone TEXT;

-- Add phone column to submissions table  
ALTER TABLE public.submissions 
ADD COLUMN phone TEXT;

-- Add phone column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN phone TEXT;