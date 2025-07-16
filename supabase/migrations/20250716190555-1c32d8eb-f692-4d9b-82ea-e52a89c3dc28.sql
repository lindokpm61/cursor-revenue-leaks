-- Update security definer functions with proper search path
-- Need to handle CASCADE dependencies for is_admin function

-- First recreate get_current_user_role with proper search path
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

-- Update is_admin function with proper search path (keeping CASCADE dependencies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_current_user_role() = 'admin';
$$;

-- Update check_admin_access function with proper search path
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

-- Update other functions to have proper search path
CREATE OR REPLACE FUNCTION public.check_rate_limit(user_identifier text, action_type text, max_per_hour integer DEFAULT 100)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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