-- Add admin access policy to profiles table
CREATE POLICY "Admin users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Allow users to see their own profile (existing functionality)
  auth.uid() = id 
  OR 
  -- OR allow admin users to see all profiles
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() 
    AND p2.role = 'admin'
  )
);