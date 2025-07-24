-- Fix remaining function search path issues

-- Fix all functions to have proper search paths
CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_submissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.link_submissions_to_user(p_user_id uuid, p_user_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.analyze_user_pattern(user_email text)
RETURNS TABLE(user_type text, business_model text, value_tier text, total_companies integer, unique_industries integer, total_arr bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;