-- Create A/B testing infrastructure tables

-- Experiments table to store test configurations
CREATE TABLE public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'ab_test', -- 'ab_test', 'multivariate'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  target_metric TEXT NOT NULL, -- 'conversion_rate', 'email_open_rate', etc.
  traffic_allocation NUMERIC NOT NULL DEFAULT 50, -- percentage 0-100
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  configuration JSONB NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '{}',
  statistical_significance NUMERIC DEFAULT 0,
  winner_variant_id UUID DEFAULT NULL
);

-- Experiment variants table
CREATE TABLE public.experiment_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_control BOOLEAN NOT NULL DEFAULT false,
  traffic_weight NUMERIC NOT NULL DEFAULT 50, -- percentage of traffic allocation
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User experiment assignments table
CREATE TABLE public.experiment_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- user_id, temp_id, or session_id
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, user_identifier)
);

-- Experiment events table for tracking variant-specific events
CREATE TABLE public.experiment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'click', 'conversion', 'email_open', etc.
  event_data JSONB DEFAULT '{}',
  value NUMERIC DEFAULT 0, -- for revenue tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiments
CREATE POLICY "Admins can manage all experiments" 
ON public.experiments 
FOR ALL 
USING (is_admin());

CREATE POLICY "Users can view active experiments" 
ON public.experiments 
FOR SELECT 
USING (status = 'active');

-- RLS Policies for experiment_variants
CREATE POLICY "Admins can manage all variants" 
ON public.experiment_variants 
FOR ALL 
USING (is_admin());

CREATE POLICY "Users can view variants of active experiments" 
ON public.experiment_variants 
FOR SELECT 
USING (EXISTS(
  SELECT 1 FROM public.experiments 
  WHERE experiments.id = experiment_variants.experiment_id 
  AND experiments.status = 'active'
));

-- RLS Policies for experiment_assignments
CREATE POLICY "Admins can manage all assignments" 
ON public.experiment_assignments 
FOR ALL 
USING (is_admin());

CREATE POLICY "Users can view their own assignments" 
ON public.experiment_assignments 
FOR SELECT 
USING (user_identifier = COALESCE(auth.uid()::text, session_user));

CREATE POLICY "System can create assignments" 
ON public.experiment_assignments 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for experiment_events
CREATE POLICY "Admins can manage all experiment events" 
ON public.experiment_events 
FOR ALL 
USING (is_admin());

CREATE POLICY "System can create experiment events" 
ON public.experiment_events 
FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_experiments_status ON public.experiments(status);
CREATE INDEX idx_experiments_dates ON public.experiments(start_date, end_date);
CREATE INDEX idx_experiment_assignments_user ON public.experiment_assignments(user_identifier);
CREATE INDEX idx_experiment_assignments_experiment ON public.experiment_assignments(experiment_id);
CREATE INDEX idx_experiment_events_experiment_variant ON public.experiment_events(experiment_id, variant_id);
CREATE INDEX idx_experiment_events_type_date ON public.experiment_events(event_type, created_at);

-- Functions for experiment management
CREATE OR REPLACE FUNCTION public.assign_experiment_variant(
  p_experiment_id UUID,
  p_user_identifier TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  variant_id UUID;
  random_value NUMERIC;
  cumulative_weight NUMERIC := 0;
  variant_record RECORD;
BEGIN
  -- Check if user already assigned to this experiment
  SELECT ea.variant_id INTO variant_id
  FROM public.experiment_assignments ea
  WHERE ea.experiment_id = p_experiment_id 
  AND ea.user_identifier = p_user_identifier;
  
  IF variant_id IS NOT NULL THEN
    RETURN variant_id;
  END IF;
  
  -- Check if experiment is active
  IF NOT EXISTS(
    SELECT 1 FROM public.experiments 
    WHERE id = p_experiment_id AND status = 'active'
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Generate random value for assignment
  random_value := random() * 100;
  
  -- Assign based on traffic weights
  FOR variant_record IN
    SELECT id, traffic_weight 
    FROM public.experiment_variants 
    WHERE experiment_id = p_experiment_id 
    ORDER BY created_at
  LOOP
    cumulative_weight := cumulative_weight + variant_record.traffic_weight;
    IF random_value <= cumulative_weight THEN
      variant_id := variant_record.id;
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert assignment
  IF variant_id IS NOT NULL THEN
    INSERT INTO public.experiment_assignments (experiment_id, variant_id, user_identifier)
    VALUES (p_experiment_id, variant_id, p_user_identifier)
    ON CONFLICT (experiment_id, user_identifier) DO NOTHING;
  END IF;
  
  RETURN variant_id;
END;
$$;

-- Function to calculate statistical significance
CREATE OR REPLACE FUNCTION public.calculate_experiment_significance(
  p_experiment_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  control_conversions INTEGER;
  control_total INTEGER;
  test_conversions INTEGER;
  test_total INTEGER;
  p_value NUMERIC;
BEGIN
  -- Get control variant data
  SELECT 
    COUNT(CASE WHEN ee.event_type = 'conversion' THEN 1 END) as conversions,
    COUNT(DISTINCT ee.user_identifier) as total
  INTO control_conversions, control_total
  FROM public.experiment_events ee
  JOIN public.experiment_variants ev ON ee.variant_id = ev.id
  WHERE ee.experiment_id = p_experiment_id
  AND ev.is_control = true;
  
  -- Get test variant data (first non-control variant)
  SELECT 
    COUNT(CASE WHEN ee.event_type = 'conversion' THEN 1 END) as conversions,
    COUNT(DISTINCT ee.user_identifier) as total
  INTO test_conversions, test_total
  FROM public.experiment_events ee
  JOIN public.experiment_variants ev ON ee.variant_id = ev.id
  WHERE ee.experiment_id = p_experiment_id
  AND ev.is_control = false
  LIMIT 1;
  
  -- Simple chi-square test approximation
  -- This is a simplified version - in production you'd want more sophisticated statistical tests
  IF control_total > 30 AND test_total > 30 THEN
    p_value := CASE 
      WHEN abs((test_conversions::NUMERIC / test_total) - (control_conversions::NUMERIC / control_total)) > 0.05 
      THEN 0.05  -- Simplified significance threshold
      ELSE 0.5
    END;
  ELSE
    p_value := 1.0; -- Not enough data
  END IF;
  
  RETURN p_value;
END;
$$;

-- Trigger to update experiment results
CREATE OR REPLACE FUNCTION public.update_experiment_results()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update statistical significance
  UPDATE public.experiments 
  SET 
    statistical_significance = public.calculate_experiment_significance(NEW.experiment_id),
    updated_at = now()
  WHERE id = NEW.experiment_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_experiment_results_trigger
  AFTER INSERT ON public.experiment_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_experiment_results();

-- Update timestamps trigger
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiment_variants_updated_at
  BEFORE UPDATE ON public.experiment_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();