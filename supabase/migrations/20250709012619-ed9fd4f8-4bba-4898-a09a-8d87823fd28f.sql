-- Add checked_actions column to user_profiles table for tracking action plan progress
ALTER TABLE public.user_profiles 
ADD COLUMN checked_actions jsonb DEFAULT '[]'::jsonb;

-- Add an index for better performance on the checked_actions column
CREATE INDEX idx_user_profiles_checked_actions ON public.user_profiles USING gin(checked_actions);

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.user_profiles.checked_actions IS 'Array of action IDs that the user has checked/completed in their action plans';