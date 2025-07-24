-- Add missing actions_checked_count column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS actions_checked_count INTEGER DEFAULT 0;