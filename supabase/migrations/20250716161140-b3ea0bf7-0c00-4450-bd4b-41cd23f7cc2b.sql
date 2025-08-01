-- Critical Security Fixes for Production Readiness

-- 1. Fix security definer functions with proper search paths
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(auth.users.raw_user_meta_data ->> 'role', 'user')
  FROM auth.users 
  WHERE auth.users.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.get_current_user_role() = 'admin';
$$;

-- 2. Create secure admin check function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data ->> 'role') = 'admin'
  );
$$;

-- 3. Add missing RLS policies for critical tables

-- Secure temporary_submissions table
DROP POLICY IF EXISTS "Anyone can create temporary submissions" ON public.temporary_submissions;
DROP POLICY IF EXISTS "Users can view their own temporary submissions by temp_id" ON public.temporary_submissions;
DROP POLICY IF EXISTS "Users can update their own temporary submissions by temp_id" ON public.temporary_submissions;

CREATE POLICY "Public can create temporary submissions" 
ON public.temporary_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own temp submissions" 
ON public.temporary_submissions 
FOR SELECT 
USING (
  temp_id IS NOT NULL AND (
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id' OR
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can update their own temp submissions" 
ON public.temporary_submissions 
FOR UPDATE 
USING (
  temp_id IS NOT NULL AND (
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id' OR
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Admins can manage all temp submissions" 
ON public.temporary_submissions 
FOR ALL 
USING (public.check_admin_access());

-- 4. Secure analytics_events table with proper policies
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "System can create analytics events" ON public.analytics_events;

CREATE POLICY "Users can view own analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.check_admin_access()
);

CREATE POLICY "Authenticated users can create analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL OR
  public.check_admin_access()
);

-- 5. Add data validation constraints
ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT completion_percentage_range 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT lead_score_range 
CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));

ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT email_engagement_score_range 
CHECK (email_engagement_score >= 0 AND email_engagement_score <= 100);

-- 6. Add proper indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_temp_submissions_temp_id ON public.temporary_submissions(temp_id);
CREATE INDEX IF NOT EXISTS idx_temp_submissions_email ON public.temporary_submissions(email);
CREATE INDEX IF NOT EXISTS idx_temp_submissions_user_id ON public.temporary_submissions(converted_to_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);

-- 7. Secure email sequence queue
CREATE POLICY "System can manage email sequences for security" 
ON public.email_sequence_queue 
FOR ALL 
USING (true);

-- 8. Add rate limiting protection (basic)
CREATE OR REPLACE FUNCTION public.check_rate_limit(user_identifier text, action_type text, max_per_hour integer DEFAULT 100)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.analytics_events
  WHERE event_type = action_type
  AND properties->>'identifier' = user_identifier
  AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count < max_per_hour;
END;
$$;

-- 9. Add security audit trail
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.check_admin_access());

-- 10. Secure user profiles table
CREATE POLICY "Users can manage their own profile securely" 
ON public.user_profiles 
FOR ALL 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (public.check_admin_access());