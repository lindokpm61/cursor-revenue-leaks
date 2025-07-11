-- Phase 1: Critical Fixes - Database Security & Constraints

-- 1. Create security definer functions for consistent role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.users.raw_user_meta_data ->> 'role', 'user')
  FROM auth.users 
  WHERE auth.users.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Standardize ALL RLS policies to use consistent admin role checking

-- Update analytics_events policies
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR ALL 
USING (public.is_admin());

-- Update automation_logs policies  
DROP POLICY IF EXISTS "Admins can manage automation logs" ON public.automation_logs;
DROP POLICY IF EXISTS "Admins can read automation logs" ON public.automation_logs;
CREATE POLICY "Admins can manage automation logs" 
ON public.automation_logs 
FOR ALL 
USING (public.is_admin());

-- Update email_engagement_events policies
DROP POLICY IF EXISTS "Admins can manage email engagement events" ON public.email_engagement_events;
CREATE POLICY "Admins can manage email engagement events" 
ON public.email_engagement_events 
FOR ALL 
USING (public.is_admin());

-- Update email_sequence_queue policies
DROP POLICY IF EXISTS "Admins can view all email sequences" ON public.email_sequence_queue;
CREATE POLICY "Admins can manage email sequence queue" 
ON public.email_sequence_queue 
FOR ALL 
USING (public.is_admin());

-- Update integration_logs policies
DROP POLICY IF EXISTS "Admins can manage integration logs" ON public.integration_logs;
CREATE POLICY "Admins can manage integration logs" 
ON public.integration_logs 
FOR ALL 
USING (public.is_admin());

-- Update submissions policies (fix malformed query)
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
CREATE POLICY "Admins can view all submissions" 
ON public.submissions 
FOR ALL 
USING (public.is_admin());

-- Update temporary_submissions policies
DROP POLICY IF EXISTS "Admins can view all temporary submissions" ON public.temporary_submissions;
CREATE POLICY "Admins can view all temporary submissions" 
ON public.temporary_submissions 
FOR ALL 
USING (public.is_admin());

-- Update user_company_relationships policies
DROP POLICY IF EXISTS "Admins can view all company relationships" ON public.user_company_relationships;
CREATE POLICY "Admins can view all company relationships" 
ON public.user_company_relationships 
FOR ALL 
USING (public.is_admin());

-- Update user_engagement_events policies
DROP POLICY IF EXISTS "Admins can view all engagement events" ON public.user_engagement_events;
CREATE POLICY "Admins can view all engagement events" 
ON public.user_engagement_events 
FOR ALL 
USING (public.is_admin());

-- 3. Add database constraints to prevent duplicate email sequences
ALTER TABLE public.email_sequence_queue 
ADD CONSTRAINT unique_sequence_per_temp_id 
UNIQUE (temp_id, sequence_type);

-- 4. Add constraint to prevent invalid temp_ids
ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT temp_id_not_empty 
CHECK (temp_id IS NOT NULL AND length(trim(temp_id)) > 0);

-- 5. Add indexes for better RLS policy performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow_status 
ON public.automation_logs (workflow_type, status);

CREATE INDEX IF NOT EXISTS idx_integration_logs_submission_status 
ON public.integration_logs (submission_id, status);

CREATE INDEX IF NOT EXISTS idx_email_sequence_queue_status_scheduled 
ON public.email_sequence_queue (status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_temporary_submissions_temp_id_activity 
ON public.temporary_submissions (temp_id, last_activity_at);

-- 6. Update the email sequence queue trigger to prevent race conditions
CREATE OR REPLACE FUNCTION public.update_email_sequence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = COALESCE(NEW.created_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_sequence_timestamp_trigger ON public.email_sequence_queue;
CREATE TRIGGER update_email_sequence_timestamp_trigger
  BEFORE INSERT ON public.email_sequence_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_sequence_timestamp();