-- Fix critical security issues: Update analytics views and functions with proper search_path

-- Fix security definer views by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS abandonment_analytics;
DROP VIEW IF EXISTS email_sequence_analytics;

-- Recreate analytics views without security definer
CREATE VIEW abandonment_analytics AS
SELECT 
  current_step,
  ROUND(AVG(recovery_potential), 2) as avg_recovery_potential,
  ROUND(
    COUNT(*) FILTER (WHERE converted_to_user_id IS NOT NULL)::numeric / 
    COUNT(*)::numeric * 100, 2
  ) as conversion_rate,
  ROUND(
    COUNT(*) FILTER (WHERE converted_to_user_id IS NULL AND expires_at < NOW())::numeric / 
    COUNT(*)::numeric * 100, 2
  ) as abandonment_rate,
  COUNT(*) as total_at_step,
  COUNT(*) FILTER (WHERE converted_to_user_id IS NOT NULL) as converted_from_step,
  COUNT(*) FILTER (WHERE current_step > 1) as progressed_from_step,
  COUNT(*) FILTER (WHERE recovery_potential > 50000) as high_value_count
FROM temporary_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY current_step
ORDER BY current_step;

CREATE VIEW email_sequence_analytics AS
SELECT 
  date_trunc('week', created_at) as week,
  sequence_type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as total_opens,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as total_clicks,
  COUNT(*) FILTER (WHERE conversion_completed_at IS NOT NULL) as total_conversions,
  ROUND(
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::numeric / 
    COUNT(*)::numeric * 100, 2
  ) as open_rate,
  ROUND(
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric / 
    COUNT(*)::numeric * 100, 2
  ) as click_rate,
  ROUND(
    COUNT(*) FILTER (WHERE conversion_completed_at IS NOT NULL)::numeric / 
    COUNT(*)::numeric * 100, 2
  ) as conversion_rate,
  COALESCE(SUM(revenue_attributed), 0) as total_revenue
FROM email_sequence_queue
WHERE created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY date_trunc('week', created_at), sequence_type
ORDER BY week DESC, sequence_type;

-- Fix function search paths for all database functions
CREATE OR REPLACE FUNCTION public.analyze_user_pattern(user_email text)
 RETURNS TABLE(user_type text, business_model text, value_tier text, total_companies integer, unique_industries integer, total_arr bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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
      SELECT 1 FROM submissions s 
      WHERE s.contact_email = user_email 
      AND LOWER(s.company_name) LIKE '%' || LOWER(split_part(email_domain, '.', 1)) || '%'
    )
  INTO company_count, industry_count, total_revenue, has_matching_domain
  FROM submissions 
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
 SET search_path = 'public'
AS $function$
DECLARE
  submission_record RECORD;
  linked_count INTEGER := 0;
BEGIN
  -- Link all submissions with matching email to the user
  FOR submission_record IN 
    SELECT * FROM submissions 
    WHERE contact_email = p_user_email 
    AND (user_id IS NULL OR user_id = p_user_id)
  LOOP
    -- Update submission with user_id
    UPDATE submissions 
    SET user_id = p_user_id, updated_at = NOW()
    WHERE id = submission_record.id;
    
    -- Create company relationship record
    INSERT INTO user_company_relationships (
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
  UPDATE user_profiles 
  SET 
    total_companies_analyzed = (
      SELECT COUNT(DISTINCT analyzed_company_name) 
      FROM user_company_relationships 
      WHERE user_id = p_user_id
    ),
    unique_industries_analyzed = (
      SELECT COUNT(DISTINCT s.industry) 
      FROM user_company_relationships ucr
      JOIN submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id AND s.industry IS NOT NULL
    ),
    total_portfolio_value = (
      SELECT COALESCE(SUM(company_arr), 0) 
      FROM user_company_relationships 
      WHERE user_id = p_user_id
    ),
    first_submission_date = (
      SELECT MIN(s.created_at) 
      FROM user_company_relationships ucr
      JOIN submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id
    ),
    most_recent_submission_date = (
      SELECT MAX(s.created_at) 
      FROM user_company_relationships ucr
      JOIN submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id
    ),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN linked_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_email_performance(p_sequence_type text, p_contact_email text, p_event_type text, p_revenue_amount bigint DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF p_event_type = 'opened' THEN
    UPDATE public.email_sequence_queue 
    SET opened_at = NOW()
    WHERE sequence_type = p_sequence_type 
    AND contact_email = p_contact_email 
    AND opened_at IS NULL;
    
  ELSIF p_event_type = 'clicked' THEN
    UPDATE public.email_sequence_queue 
    SET clicked_at = NOW()
    WHERE sequence_type = p_sequence_type 
    AND contact_email = p_contact_email;
    
  ELSIF p_event_type = 'converted' THEN
    UPDATE public.email_sequence_queue 
    SET conversion_completed_at = NOW(),
        revenue_attributed = p_revenue_amount
    WHERE sequence_type = p_sequence_type 
    AND contact_email = p_contact_email;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_engagement_score(user_events jsonb[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  total_score INTEGER := 0;
  event_record JSONB;
  event_type TEXT;
  score_map JSONB := '{
    "action_plan_viewed": 10,
    "action_interaction": 25,
    "tab_navigation": 5,
    "time_spent_2min": 15,
    "time_spent_5min": 25,
    "next_steps_viewed": 20,
    "return_visit": 30,
    "cta_interaction": 35,
    "session_end": 5
  }'::jsonb;
BEGIN
  FOREACH event_record IN ARRAY user_events
  LOOP
    event_type := event_record->>'event_type';
    total_score := total_score + COALESCE((score_map->>event_type)::INTEGER, 0);
  END LOOP;
  
  -- Cap the score at 100
  RETURN LEAST(total_score, 100);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_engagement_score(p_user_id uuid, p_event_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_score INTEGER;
  event_points INTEGER;
  new_score INTEGER;
  score_map JSONB := '{
    "action_plan_viewed": 10,
    "action_interaction": 25,
    "tab_navigation": 5,
    "time_spent_2min": 15,
    "time_spent_5min": 25,
    "next_steps_viewed": 20,
    "return_visit": 30,
    "cta_interaction": 35,
    "session_end": 5
  }'::jsonb;
BEGIN
  -- Get current engagement score
  SELECT COALESCE(engagement_score, 0) INTO current_score
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Get points for this event type
  event_points := COALESCE((score_map->>p_event_type)::INTEGER, 0);
  
  -- Calculate new score (capped at 100)
  new_score := LEAST(current_score + event_points, 100);
  
  -- Update user profile with new engagement data
  INSERT INTO public.user_profiles (
    id, 
    engagement_score, 
    last_action_plan_visit,
    high_intent_lead,
    updated_at
  ) VALUES (
    p_user_id,
    new_score,
    NOW(),
    new_score > 70,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    engagement_score = new_score,
    last_action_plan_visit = NOW(),
    high_intent_lead = new_score > 70,
    updated_at = NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.perform_database_cleanup()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Archive old converted submissions (older than 30 days)
  UPDATE public.temporary_submissions 
  SET archived_at = NOW()
  WHERE converted_to_user_id IS NOT NULL 
  AND conversion_completed_at < NOW() - INTERVAL '30 days'
  AND archived_at IS NULL;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Delete expired unconverted submissions
  DELETE FROM public.temporary_submissions 
  WHERE expires_at < NOW() 
  AND converted_to_user_id IS NULL;
  
  -- Clean up old email sequence queue entries (older than 7 days)
  DELETE FROM public.email_sequence_queue 
  WHERE status = 'sent' 
  AND sent_at < NOW() - INTERVAL '7 days';
  
  RETURN cleanup_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT COALESCE(auth.users.raw_user_meta_data ->> 'role', 'user')
  FROM auth.users 
  WHERE auth.users.id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_submissions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT public.get_current_user_role() = 'admin';
$function$;

CREATE OR REPLACE FUNCTION public.get_users_with_analytics(limit_count integer DEFAULT 100)
 RETURNS TABLE(user_id uuid, email text, created_at timestamp with time zone, email_confirmed_at timestamp with time zone, last_sign_in_at timestamp with time zone, user_role text, user_company text, user_type text, total_submissions bigint, companies_analyzed bigint, first_submission_date timestamp with time zone, last_submission_date timestamp with time zone, avg_lead_score numeric, total_pipeline_value bigint, account_status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE(u.raw_user_meta_data->>'role', 'user') as user_role,
    up.company_name as user_company,
    COALESCE(up.user_type, 'standard') as user_type,
    COALESCE(COUNT(DISTINCT s.id), 0) as total_submissions,
    COALESCE(COUNT(DISTINCT s.company_name), 0) as companies_analyzed,
    MIN(s.created_at) as first_submission_date,
    MAX(s.created_at) as last_submission_date,
    COALESCE(AVG(s.lead_score), 0) as avg_lead_score,
    COALESCE(SUM(s.recovery_potential_70), 0) as total_pipeline_value,
    CASE 
      WHEN u.email_confirmed_at IS NULL THEN 'pending_verification'
      WHEN u.last_sign_in_at < NOW() - INTERVAL '30 days' THEN 'inactive'
      ELSE 'active'
    END as account_status
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON u.id = up.id
  LEFT JOIN public.submissions s ON u.id = s.user_id
  GROUP BY 
    u.id, 
    u.email, 
    u.created_at, 
    u.email_confirmed_at, 
    u.last_sign_in_at, 
    u.raw_user_meta_data,
    up.company_name, 
    up.user_type
  ORDER BY u.created_at DESC
  LIMIT limit_count;
$function$;

CREATE OR REPLACE FUNCTION public.get_submissions_with_user_data(limit_count integer DEFAULT 100)
 RETURNS TABLE(id uuid, company_name text, contact_email text, industry text, current_arr bigint, monthly_leads bigint, average_deal_value bigint, lead_response_time bigint, monthly_free_signups bigint, free_to_paid_conversion numeric, monthly_mrr bigint, failed_payment_rate numeric, manual_hours bigint, hourly_rate bigint, lead_response_loss bigint, failed_payment_loss bigint, selfserve_gap_loss bigint, process_inefficiency_loss bigint, total_leak bigint, leak_percentage numeric, recovery_potential_70 bigint, recovery_potential_85 bigint, lead_score bigint, created_at timestamp with time zone, updated_at timestamp with time zone, user_id uuid, user_email text, user_registered_date timestamp with time zone, user_last_login timestamp with time zone, user_email_verified boolean, user_role text, user_company_name text, user_type text, user_total_submissions bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    -- Submission data
    s.id,
    s.company_name,
    s.contact_email,
    s.industry,
    s.current_arr,
    s.monthly_leads,
    s.average_deal_value,
    s.lead_response_time,
    s.monthly_free_signups,
    s.free_to_paid_conversion,
    s.monthly_mrr,
    s.failed_payment_rate,
    s.manual_hours,
    s.hourly_rate,
    s.lead_response_loss,
    s.failed_payment_loss,
    s.selfserve_gap_loss,
    s.process_inefficiency_loss,
    s.total_leak,
    s.leak_percentage,
    s.recovery_potential_70,
    s.recovery_potential_85,
    s.lead_score,
    s.created_at,
    s.updated_at,
    s.user_id,
    
    -- User data
    u.email as user_email,
    u.created_at as user_registered_date,
    u.last_sign_in_at as user_last_login,
    (u.email_confirmed_at IS NOT NULL) as user_email_verified,
    COALESCE(u.raw_user_meta_data->>'role', 'user') as user_role,
    up.company_name as user_company_name,
    COALESCE(up.user_type, 'standard') as user_type,
    
    -- Count of total submissions by this user
    (SELECT COUNT(*) FROM public.submissions s2 WHERE s2.user_id = s.user_id) as user_total_submissions
    
  FROM public.submissions s
  LEFT JOIN auth.users u ON s.user_id = u.id
  LEFT JOIN public.user_profiles up ON s.user_id = up.id
  ORDER BY s.created_at DESC
  LIMIT limit_count;
$function$;