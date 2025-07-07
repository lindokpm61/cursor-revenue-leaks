-- Create a function to get comprehensive user data with analytics
CREATE OR REPLACE FUNCTION public.get_users_with_analytics(limit_count integer DEFAULT 100)
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  user_role text,
  user_company text,
  user_type text,
  total_submissions bigint,
  companies_analyzed bigint,
  first_submission_date timestamptz,
  last_submission_date timestamptz,
  avg_lead_score numeric,
  total_pipeline_value bigint,
  account_status text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
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
$$;