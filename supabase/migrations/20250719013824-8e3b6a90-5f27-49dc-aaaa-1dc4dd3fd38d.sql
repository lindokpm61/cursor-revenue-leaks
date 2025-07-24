
-- Create landing page A/B test experiment
INSERT INTO public.experiments (
  name,
  description,
  type,
  status,
  target_metric,
  traffic_allocation,
  start_date,
  configuration
) VALUES (
  'landing_page_test',
  'A/B test comparing streamlined Index.tsx vs comprehensive Landing.tsx',
  'ab_test',
  'active',
  'conversion_rate',
  100,
  NOW(),
  '{"test_type": "landing_page", "primary_metric": "calculator_starts", "secondary_metrics": ["time_on_page", "email_captures"]}'::jsonb
);

-- Get the experiment ID for creating variants
-- Create Control variant (Index.tsx - streamlined)
INSERT INTO public.experiment_variants (
  experiment_id,
  name,
  description,
  is_control,
  traffic_weight,
  configuration
) VALUES (
  (SELECT id FROM public.experiments WHERE name = 'landing_page_test'),
  'Control - Streamlined',
  'Current Index.tsx with streamlined hero and direct calculator access',
  true,
  50,
  '{"page": "index", "style": "streamlined", "features": ["hero", "calculator_cta"]}'::jsonb
);

-- Create Variant B (Landing.tsx - comprehensive)
INSERT INTO public.experiment_variants (
  experiment_id,
  name,
  description,
  is_control,
  traffic_weight,
  configuration
) VALUES (
  (SELECT id FROM public.experiments WHERE name = 'landing_page_test'),
  'Variant B - Comprehensive',
  'Current Landing.tsx with comprehensive content and multiple sections',
  false,
  50,
  '{"page": "landing", "style": "comprehensive", "features": ["hero", "features", "social_proof", "testimonials", "multiple_ctas"]}'::jsonb
);
