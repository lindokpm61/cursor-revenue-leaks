-- Fix existing user profile for the test user
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
  '0907f61c-b02d-4996-9487-4362b0ee2d92',
  'FlowSync Pro',
  'internal',
  'user',
  'FlowSync Pro',
  'user',
  'standard',
  'standard',
  'standard',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_name = 'FlowSync Pro',
  business_model = 'internal',
  role = 'user',
  actual_company_name = 'FlowSync Pro',
  actual_role = 'user',
  updated_at = NOW();