-- Create a function to get submissions with user details
CREATE OR REPLACE FUNCTION public.get_submissions_with_user_data(limit_count integer DEFAULT 100)
RETURNS TABLE (
  -- Submission fields
  id uuid,
  company_name text,
  contact_email text,
  industry text,
  current_arr bigint,
  monthly_leads bigint,
  average_deal_value bigint,
  lead_response_time bigint,
  monthly_free_signups bigint,
  free_to_paid_conversion numeric,
  monthly_mrr bigint,
  failed_payment_rate numeric,
  manual_hours bigint,
  hourly_rate bigint,
  lead_response_loss bigint,
  failed_payment_loss bigint,
  selfserve_gap_loss bigint,
  process_inefficiency_loss bigint,
  total_leak bigint,
  leak_percentage numeric,
  recovery_potential_70 bigint,
  recovery_potential_85 bigint,
  lead_score bigint,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  
  -- User fields
  user_email text,
  user_registered_date timestamptz,
  user_last_login timestamptz,
  user_email_verified boolean,
  user_role text,
  user_company_name text,
  user_type text,
  user_total_submissions bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
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
$$;