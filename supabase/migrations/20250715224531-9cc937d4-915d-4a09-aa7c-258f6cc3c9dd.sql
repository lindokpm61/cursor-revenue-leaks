-- Phase 1: Critical Security Fixes and Database Optimization

-- Fix 1: Remove Security Definer Views and replace with proper RLS
-- First, let's check what views exist and recreate them without SECURITY DEFINER
DROP VIEW IF EXISTS abandonment_analytics CASCADE;
DROP VIEW IF EXISTS email_sequence_analytics CASCADE;

-- Recreate abandonment_analytics without SECURITY DEFINER
CREATE VIEW abandonment_analytics AS
SELECT 
  ts.current_step,
  COUNT(CASE WHEN ts.converted_to_user_id IS NULL AND ts.expires_at < NOW() THEN 1 END) as total_at_step,
  COUNT(CASE WHEN ts.conversion_completed_at IS NOT NULL THEN 1 END) as converted_from_step,
  COUNT(CASE WHEN ts.current_step > 1 THEN 1 END) as progressed_from_step,
  COUNT(CASE WHEN ts.recovery_potential > 50000 THEN 1 END) as high_value_count,
  ROUND(AVG(CASE WHEN ts.recovery_potential IS NOT NULL THEN ts.recovery_potential END), 2) as avg_recovery_potential,
  ROUND(
    CAST(COUNT(CASE WHEN ts.conversion_completed_at IS NOT NULL THEN 1 END) AS DECIMAL) / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate,
  ROUND(
    CAST(COUNT(CASE WHEN ts.converted_to_user_id IS NULL AND ts.expires_at < NOW() THEN 1 END) AS DECIMAL) / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as abandonment_rate
FROM temporary_submissions ts
WHERE ts.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ts.current_step
ORDER BY ts.current_step;

-- Recreate email_sequence_analytics without SECURITY DEFINER
CREATE VIEW email_sequence_analytics AS
SELECT 
  esq.sequence_type,
  DATE_TRUNC('week', esq.created_at) as week,
  COUNT(*) as total_sent,
  COUNT(esq.opened_at) as total_opens,
  COUNT(esq.clicked_at) as total_clicks,
  COUNT(esq.conversion_completed_at) as total_conversions,
  COALESCE(SUM(esq.revenue_attributed), 0) as total_revenue,
  ROUND(
    CAST(COUNT(esq.opened_at) AS DECIMAL) / NULLIF(COUNT(*), 0) * 100, 2
  ) as open_rate,
  ROUND(
    CAST(COUNT(esq.clicked_at) AS DECIMAL) / NULLIF(COUNT(*), 0) * 100, 2
  ) as click_rate,
  ROUND(
    CAST(COUNT(esq.conversion_completed_at) AS DECIMAL) / NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate
FROM email_sequence_queue esq
WHERE esq.sent_at IS NOT NULL
  AND esq.created_at >= NOW() - INTERVAL '90 days'
GROUP BY esq.sequence_type, DATE_TRUNC('week', esq.created_at)
ORDER BY week DESC, esq.sequence_type;

-- Fix 2: Add SET search_path = '' to all functions for security
-- Update existing functions to have proper search_path

-- Update update_temp_submission_timestamp
CREATE OR REPLACE FUNCTION public.update_temp_submission_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.last_updated = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(auth.users.raw_user_meta_data ->> 'role', 'user')
  FROM auth.users 
  WHERE auth.users.id = auth.uid();
$function$;

-- Update cleanup_expired_temp_submissions
CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_submissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired temporary submissions and related email queue entries
  DELETE FROM public.email_sequence_queue 
  WHERE temp_id IN (
    SELECT temp_id FROM public.temporary_submissions 
    WHERE expires_at < NOW() AND converted_to_user_id IS NULL
  );
  
  DELETE FROM public.temporary_submissions 
  WHERE expires_at < NOW() AND converted_to_user_id IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Update is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.get_current_user_role() = 'admin';
$function$;

-- Update update_email_sequence_timestamp
CREATE OR REPLACE FUNCTION public.update_email_sequence_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.created_at = COALESCE(NEW.created_at, NOW());
  RETURN NEW;
END;
$function$;

-- Fix 3: Database Optimization - Add proper indexes for performance
-- Add indexes for frequently queried columns

-- Index for temporary_submissions lookups
CREATE INDEX IF NOT EXISTS idx_temp_submissions_temp_id ON public.temporary_submissions(temp_id);
CREATE INDEX IF NOT EXISTS idx_temp_submissions_email ON public.temporary_submissions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_temp_submissions_created_at ON public.temporary_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_temp_submissions_expires_at ON public.temporary_submissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_submissions_current_step ON public.temporary_submissions(current_step);
CREATE INDEX IF NOT EXISTS idx_temp_submissions_converted_user ON public.temporary_submissions(converted_to_user_id) WHERE converted_to_user_id IS NOT NULL;

-- Index for submissions lookups
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_contact_email ON public.submissions(contact_email);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_lead_score ON public.submissions(lead_score) WHERE lead_score IS NOT NULL;

-- Index for email sequence queue
CREATE INDEX IF NOT EXISTS idx_email_queue_contact_email ON public.email_sequence_queue(contact_email);
CREATE INDEX IF NOT EXISTS idx_email_queue_sequence_type ON public.email_sequence_queue(sequence_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_sequence_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON public.email_sequence_queue(scheduled_for);

-- Index for analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Index for integration logs
CREATE INDEX IF NOT EXISTS idx_integration_logs_submission_id ON public.integration_logs(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_type ON public.integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status);

-- Index for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_engagement_score ON public.user_profiles(engagement_score) WHERE engagement_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_classification ON public.user_profiles(user_classification) WHERE user_classification IS NOT NULL;

-- Fix 4: Standardize timestamp usage (with timezone)
-- Update tables to use consistent timestamp with time zone

-- Fix temporary_submissions timestamp inconsistencies
ALTER TABLE public.temporary_submissions 
  ALTER COLUMN created_at TYPE timestamp with time zone,
  ALTER COLUMN last_updated TYPE timestamp with time zone,
  ALTER COLUMN last_activity_at TYPE timestamp with time zone,
  ALTER COLUMN expires_at TYPE timestamp with time zone,
  ALTER COLUMN conversion_completed_at TYPE timestamp with time zone,
  ALTER COLUMN archived_at TYPE timestamp with time zone,
  ALTER COLUMN last_email_sent_at TYPE timestamp with time zone,
  ALTER COLUMN last_analysis_date TYPE timestamp with time zone;

-- Fix email_sequence_queue timestamp inconsistencies  
ALTER TABLE public.email_sequence_queue
  ALTER COLUMN created_at TYPE timestamp with time zone,
  ALTER COLUMN scheduled_for TYPE timestamp with time zone,
  ALTER COLUMN sent_at TYPE timestamp with time zone,
  ALTER COLUMN opened_at TYPE timestamp with time zone,
  ALTER COLUMN clicked_at TYPE timestamp with time zone,
  ALTER COLUMN conversion_completed_at TYPE timestamp with time zone;

-- Fix 5: Add foreign key constraints where missing
-- Add proper foreign key relationships

-- Add foreign key from temporary_submissions to users (when converted)
ALTER TABLE public.temporary_submissions 
  ADD CONSTRAINT fk_temp_submissions_converted_user 
  FOREIGN KEY (converted_to_user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Add foreign key from submissions to users
ALTER TABLE public.submissions 
  ADD CONSTRAINT fk_submissions_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Add foreign key from user_profiles to users
ALTER TABLE public.user_profiles 
  ADD CONSTRAINT fk_user_profiles_user 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Add foreign key from analytics_events to users
ALTER TABLE public.analytics_events 
  ADD CONSTRAINT fk_analytics_events_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Add foreign key from user_engagement_events to users
ALTER TABLE public.user_engagement_events 
  ADD CONSTRAINT fk_user_engagement_events_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Add foreign key from crm_persons to users
ALTER TABLE public.crm_persons 
  ADD CONSTRAINT fk_crm_persons_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;