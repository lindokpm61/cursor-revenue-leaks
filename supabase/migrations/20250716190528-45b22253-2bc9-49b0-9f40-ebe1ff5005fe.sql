-- Fix security definer functions search path
DROP FUNCTION IF EXISTS public.get_current_user_role();
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(auth.users.raw_user_meta_data ->> 'role', 'user')
  FROM auth.users 
  WHERE auth.users.id = auth.uid();
$$;

DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_current_user_role() = 'admin';
$$;

DROP FUNCTION IF EXISTS public.check_admin_access();
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data ->> 'role') = 'admin'
  );
$$;

-- Fix security definer views by dropping and recreating them as regular views
DROP VIEW IF EXISTS public.email_sequence_analytics;
DROP VIEW IF EXISTS public.abandonment_analytics;

-- Create secure analytics views
CREATE VIEW public.email_sequence_analytics AS
SELECT 
  sequence_type,
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_sent,
  COUNT(opened_at) as total_opens,
  COUNT(clicked_at) as total_clicks,
  COUNT(conversion_completed_at) as total_conversions,
  COALESCE(SUM(revenue_attributed), 0) as total_revenue,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(opened_at)::numeric / COUNT(*) * 100), 2)
    ELSE 0 
  END as open_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(clicked_at)::numeric / COUNT(*) * 100), 2)
    ELSE 0 
  END as click_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(conversion_completed_at)::numeric / COUNT(*) * 100), 2)
    ELSE 0 
  END as conversion_rate
FROM public.email_sequence_queue
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY sequence_type, DATE_TRUNC('week', created_at)
ORDER BY week DESC, sequence_type;

CREATE VIEW public.abandonment_analytics AS
SELECT 
  current_step,
  COUNT(*) as total_at_step,
  COUNT(CASE WHEN steps_completed > current_step THEN 1 END) as progressed_from_step,
  COUNT(CASE WHEN converted_to_user_id IS NOT NULL THEN 1 END) as converted_from_step,
  COUNT(CASE WHEN lead_score >= 70 THEN 1 END) as high_value_count,
  AVG(recovery_potential) as avg_recovery_potential,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN steps_completed > current_step THEN 1 END)::numeric / COUNT(*) * 100), 2)
    ELSE 0 
  END as conversion_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN expires_at < NOW() AND converted_to_user_id IS NULL THEN 1 END)::numeric / COUNT(*) * 100), 2)
    ELSE 0 
  END as abandonment_rate
FROM public.temporary_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY current_step
ORDER BY current_step;