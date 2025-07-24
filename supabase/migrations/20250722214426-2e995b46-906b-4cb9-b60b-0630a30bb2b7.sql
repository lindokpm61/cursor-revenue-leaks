-- Add admin access policy to calculator_submissions
CREATE POLICY "Admin users can view all submissions" 
ON public.calculator_submissions 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);