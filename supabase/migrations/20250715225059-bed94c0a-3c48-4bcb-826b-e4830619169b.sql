-- Phase 1: Critical Security Fixes and Database Optimization (Corrected)

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

-- Fix 2: Update all functions to have proper search_path for security

-- Update remaining functions that need search_path
CREATE OR REPLACE FUNCTION public.analyze_user_pattern(user_email text)
RETURNS TABLE(user_type text, business_model text, value_tier text, total_companies integer, unique_industries integer, total_arr bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  email_domain TEXT;
  company_count INTEGER;
  industry_count INTEGER;
  total_revenue BIGINT;
  has_matching_domain BOOLEAN;
BEGIN
  -- Extract email domain
  email_domain := split_part(user_email, '@', 2);
  
  -- Get submission statistics
  SELECT 
    COUNT(DISTINCT company_name),
    COUNT(DISTINCT industry),
    COALESCE(SUM(current_arr), 0),
    EXISTS(
      SELECT 1 FROM public.submissions s 
      WHERE s.contact_email = user_email 
      AND LOWER(s.company_name) LIKE '%' || LOWER(split_part(email_domain, '.', 1)) || '%'
    )
  INTO company_count, industry_count, total_revenue, has_matching_domain
  FROM public.submissions 
  WHERE contact_email = user_email;
  
  -- Classify user based on patterns
  IF company_count >= 3 AND NOT has_matching_domain THEN
    -- Consultant/Agency pattern
    RETURN QUERY SELECT 
      'consultant'::TEXT,
      'consulting'::TEXT,
      CASE 
        WHEN total_revenue > 50000000 THEN 'enterprise'
        WHEN total_revenue > 10000000 THEN 'premium'
        ELSE 'standard'
      END::TEXT,
      company_count,
      industry_count,
      total_revenue;
  ELSIF company_count >= 2 AND has_matching_domain THEN
    -- Enterprise multi-division pattern
    RETURN QUERY SELECT 
      'enterprise'::TEXT,
      'internal'::TEXT,
      'high'::TEXT,
      company_count,
      industry_count,
      total_revenue;
  ELSIF company_count >= 4 AND industry_count >= 2 THEN
    -- Investor/PE pattern
    RETURN QUERY SELECT 
      'investor'::TEXT,
      'investment'::TEXT,
      'very_high'::TEXT,
      company_count,
      industry_count,
      total_revenue;
  ELSE
    -- Standard user pattern
    RETURN QUERY SELECT 
      'standard'::TEXT,
      'internal'::TEXT,
      CASE 
        WHEN total_revenue > 5000000 THEN 'premium'
        ELSE 'standard'
      END::TEXT,
      company_count,
      industry_count,
      total_revenue;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_submissions_to_user(p_user_id uuid, p_user_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  submission_record RECORD;
  linked_count INTEGER := 0;
BEGIN
  -- Link all submissions with matching email to the user
  FOR submission_record IN 
    SELECT * FROM public.submissions 
    WHERE contact_email = p_user_email 
    AND (user_id IS NULL OR user_id = p_user_id)
  LOOP
    -- Update submission with user_id
    UPDATE public.submissions 
    SET user_id = p_user_id, updated_at = NOW()
    WHERE id = submission_record.id;
    
    -- Create company relationship record
    INSERT INTO public.user_company_relationships (
      user_id,
      submission_id,
      analyzed_company_name,
      relationship_type,
      engagement_context,
      company_arr,
      analysis_value_score
    ) VALUES (
      p_user_id,
      submission_record.id,
      submission_record.company_name,
      -- Determine relationship type based on pattern analysis
      CASE 
        WHEN EXISTS(SELECT 1 FROM public.analyze_user_pattern(p_user_email) WHERE user_type = 'consultant') THEN 'client'
        WHEN EXISTS(SELECT 1 FROM public.analyze_user_pattern(p_user_email) WHERE user_type = 'enterprise') THEN 'division'
        WHEN EXISTS(SELECT 1 FROM public.analyze_user_pattern(p_user_email) WHERE user_type = 'investor') THEN 'portfolio'
        ELSE 'employer'
      END,
      'revenue_analysis',
      submission_record.current_arr,
      submission_record.lead_score
    ) ON CONFLICT DO NOTHING;
    
    linked_count := linked_count + 1;
  END LOOP;
  
  -- Update user profile with aggregated data
  UPDATE public.user_profiles 
  SET 
    total_companies_analyzed = (
      SELECT COUNT(DISTINCT analyzed_company_name) 
      FROM public.user_company_relationships 
      WHERE user_id = p_user_id
    ),
    unique_industries_analyzed = (
      SELECT COUNT(DISTINCT s.industry) 
      FROM public.user_company_relationships ucr
      JOIN public.submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id AND s.industry IS NOT NULL
    ),
    total_portfolio_value = (
      SELECT COALESCE(SUM(company_arr), 0) 
      FROM public.user_company_relationships 
      WHERE user_id = p_user_id
    ),
    first_submission_date = (
      SELECT MIN(s.created_at) 
      FROM public.user_company_relationships ucr
      JOIN public.submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id
    ),
    most_recent_submission_date = (
      SELECT MAX(s.created_at) 
      FROM public.user_company_relationships ucr
      JOIN public.submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id
    ),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN linked_count;
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

-- Fix 4: Standardize timestamp usage (with timezone) - Only existing columns
-- Fix temporary_submissions timestamp inconsistencies for existing columns
ALTER TABLE public.temporary_submissions 
  ALTER COLUMN created_at TYPE timestamp with time zone,
  ALTER COLUMN last_updated TYPE timestamp with time zone,
  ALTER COLUMN last_activity_at TYPE timestamp with time zone,
  ALTER COLUMN expires_at TYPE timestamp with time zone,
  ALTER COLUMN conversion_completed_at TYPE timestamp with time zone,
  ALTER COLUMN archived_at TYPE timestamp with time zone,
  ALTER COLUMN last_email_sent_at TYPE timestamp with time zone;

-- Fix email_sequence_queue timestamp inconsistencies  
ALTER TABLE public.email_sequence_queue
  ALTER COLUMN created_at TYPE timestamp with time zone,
  ALTER COLUMN scheduled_for TYPE timestamp with time zone,
  ALTER COLUMN sent_at TYPE timestamp with time zone,
  ALTER COLUMN opened_at TYPE timestamp with time zone,
  ALTER COLUMN clicked_at TYPE timestamp with time zone,
  ALTER COLUMN conversion_completed_at TYPE timestamp with time zone;