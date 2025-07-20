-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  business_model TEXT,
  role TEXT,
  actual_company_name TEXT,
  actual_role TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'standard',
  engagement_tier TEXT DEFAULT 'basic',
  user_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create temporary submissions table
CREATE TABLE public.temporary_submissions (
  temp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  email TEXT,
  company_name TEXT,
  industry TEXT,
  current_step INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  completion_percentage DECIMAL DEFAULT 0,
  calculator_data JSONB DEFAULT '{}',
  total_revenue_leak DECIMAL,
  recovery_potential DECIMAL,
  lead_score INTEGER,
  email_sequences_triggered TEXT[],
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_engagement_score INTEGER DEFAULT 0,
  twenty_crm_contact_id TEXT,
  smartlead_campaign_ids TEXT[],
  n8n_workflow_status JSONB,
  user_agent TEXT,
  ip_address TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  page_views INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  return_visits INTEGER DEFAULT 0,
  calculator_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calculator submissions table
CREATE TABLE public.calculator_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  industry TEXT,
  current_arr DECIMAL,
  monthly_leads INTEGER,
  average_deal_value DECIMAL,
  lead_response_time INTEGER,
  monthly_free_signups INTEGER,
  free_to_paid_conversion DECIMAL,
  monthly_mrr DECIMAL,
  failed_payment_rate DECIMAL,
  manual_hours INTEGER,
  hourly_rate DECIMAL,
  lead_response_loss DECIMAL,
  failed_payment_loss DECIMAL,
  selfserve_gap_loss DECIMAL,
  process_inefficiency_loss DECIMAL,
  total_leak DECIMAL,
  recovery_potential_70 DECIMAL,
  recovery_potential_85 DECIMAL,
  leak_percentage DECIMAL,
  lead_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved summaries table
CREATE TABLE public.saved_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_id TEXT NOT NULL,
  summary_type TEXT NOT NULL,
  summary_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experiments table
CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'draft',
  traffic_allocation DECIMAL DEFAULT 100,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experiment variants table
CREATE TABLE public.experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_control BOOLEAN DEFAULT false,
  traffic_percentage DECIMAL NOT NULL,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experiment assignments table
CREATE TABLE public.experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  session_id TEXT,
  variant_id UUID REFERENCES public.experiment_variants(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, user_id, session_id)
);

-- Create experiment events table
CREATE TABLE public.experiment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.experiment_variants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  value DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email sequence analytics table
CREATE TABLE public.email_sequence_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  bounce_type TEXT,
  engagement_score INTEGER DEFAULT 0,
  temp_submission_id UUID REFERENCES public.temporary_submissions(temp_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for calculator submissions
CREATE POLICY "Users can view their own submissions" ON public.calculator_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" ON public.calculator_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON public.calculator_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for saved summaries
CREATE POLICY "Users can view their own summaries" ON public.saved_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" ON public.saved_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for temporary submissions (accessible to everyone for lead capture)
CREATE POLICY "Anyone can view temporary submissions" ON public.temporary_submissions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create temporary submissions" ON public.temporary_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update temporary submissions" ON public.temporary_submissions
  FOR UPDATE USING (true);

-- Create RLS policies for experiments (public read access)
CREATE POLICY "Anyone can view active experiments" ON public.experiments
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can view experiment variants" ON public.experiment_variants
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create experiment assignments" ON public.experiment_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view their assignments" ON public.experiment_assignments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create experiment events" ON public.experiment_events
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for email analytics (admin access only for now)
CREATE POLICY "Allow read access to email analytics" ON public.email_sequence_analytics
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to email analytics" ON public.email_sequence_analytics
  FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calculator_submissions_updated_at
  BEFORE UPDATE ON public.calculator_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_summaries_updated_at
  BEFORE UPDATE ON public.saved_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();