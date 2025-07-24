-- Fix RLS policies for better integration monitoring

-- Update integration_logs policies to allow system operations from edge functions
DROP POLICY IF EXISTS "System can create integration logs" ON public.integration_logs;

CREATE POLICY "System can create integration logs" 
ON public.integration_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow reading integration logs for monitoring
CREATE POLICY "System can read integration logs" 
ON public.integration_logs 
FOR SELECT 
USING (true);

-- Update automation_logs policies for admin access
CREATE POLICY "Admins can read automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
  )
);

-- Fix analytics_events policies for better system integration
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;

CREATE POLICY "Users can create analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IS NOT NULL OR 
  user_id IS NULL
);

-- Allow system to create analytics without user context
CREATE POLICY "System can create analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);