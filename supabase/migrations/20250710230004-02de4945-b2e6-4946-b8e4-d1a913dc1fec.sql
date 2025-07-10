-- Fix RLS policies for integration logs and analytics events to allow system operations

-- Drop existing restrictive policies for integration_logs
DROP POLICY IF EXISTS "Admin access integration logs" ON public.integration_logs;

-- Create new policies for integration_logs that allow system operations
CREATE POLICY "Admins can manage integration logs" 
ON public.integration_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
  )
);

CREATE POLICY "System can create integration logs" 
ON public.integration_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own integration logs" 
ON public.integration_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.submissions 
    WHERE submissions.id = integration_logs.submission_id 
    AND submissions.user_id = auth.uid()
  )
);

-- Fix analytics_events policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;

-- Create new policies that allow system operations
CREATE POLICY "Users can create analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
  )
);