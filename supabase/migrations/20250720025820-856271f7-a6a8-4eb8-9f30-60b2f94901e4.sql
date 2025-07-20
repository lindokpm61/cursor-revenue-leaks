-- Add missing columns to fix save functionality

-- Add engagement_score column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN engagement_score integer DEFAULT 0;

-- Add conversion_completed_at column to temporary_submissions table  
ALTER TABLE public.temporary_submissions 
ADD COLUMN conversion_completed_at timestamp with time zone DEFAULT NULL;