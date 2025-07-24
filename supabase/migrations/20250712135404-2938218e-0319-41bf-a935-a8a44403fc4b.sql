-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert a new user profile with default values
  INSERT INTO public.user_profiles (
    id,
    company_name,
    business_model,
    role,
    actual_company_name,
    actual_role,
    user_type,
    engagement_tier,
    user_tier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'business_model', 'internal'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', NULL),
    'standard',
    'standard',
    'standard',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', user_profiles.company_name),
    business_model = COALESCE(NEW.raw_user_meta_data->>'business_model', user_profiles.business_model),
    role = COALESCE(NEW.raw_user_meta_data->>'role', user_profiles.role),
    actual_company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', user_profiles.actual_company_name),
    actual_role = COALESCE(NEW.raw_user_meta_data->>'role', user_profiles.actual_role),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();