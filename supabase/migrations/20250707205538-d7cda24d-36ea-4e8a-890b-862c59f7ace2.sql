-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile  
CREATE POLICY "Users can delete own profile" ON public.user_profiles
FOR DELETE 
USING (auth.uid() = id);