-- Drop the problematic admin policy that references auth.users
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;

-- Create a simpler admin policy that doesn't reference auth.users table
-- This will allow admins to be handled at the application level instead
CREATE POLICY "Admins can view all submissions" ON public.submissions
  FOR ALL USING (
    -- Only allow if user has admin role in their JWT metadata
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );