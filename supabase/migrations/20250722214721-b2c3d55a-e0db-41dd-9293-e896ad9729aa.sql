-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create the correct admin policy using the function
CREATE POLICY "Admin users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Allow users to see their own profile (existing functionality)
  auth.uid() = id 
  OR 
  -- OR allow admin users to see all profiles
  public.is_admin_user()
);