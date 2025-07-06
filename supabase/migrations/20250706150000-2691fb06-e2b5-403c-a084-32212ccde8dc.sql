-- Create submissions table for revenue leak calculator
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Company Information
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  industry TEXT,
  current_arr BIGINT,
  
  -- Lead Generation Metrics
  monthly_leads INTEGER,
  average_deal_value INTEGER,
  lead_response_time INTEGER,
  
  -- Self-Serve Metrics
  monthly_free_signups INTEGER,
  free_to_paid_conversion DECIMAL(5,2),
  monthly_mrr INTEGER,
  
  -- Operations Metrics
  failed_payment_rate DECIMAL(5,2),
  manual_hours INTEGER,
  hourly_rate INTEGER,
  
  -- Calculated Results
  lead_response_loss BIGINT,
  failed_payment_loss BIGINT,
  selfserve_gap_loss BIGINT,
  process_inefficiency_loss BIGINT,
  total_leak BIGINT,
  leak_percentage DECIMAL(5,2),
  recovery_potential_70 BIGINT,
  recovery_potential_85 BIGINT,
  lead_score INTEGER,
  
  -- Integration Status
  synced_to_self_hosted BOOLEAN DEFAULT FALSE,
  twenty_contact_id TEXT,
  n8n_triggered BOOLEAN DEFAULT FALSE,
  smartlead_campaign_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for submissions
CREATE POLICY "Users can view their own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON public.submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin users can view all submissions
CREATE POLICY "Admins can view all submissions" ON public.submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create analytics events table
CREATE TABLE public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type TEXT NOT NULL,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  properties JSONB
);

-- Enable RLS for analytics events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics events
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all analytics events
CREATE POLICY "Admins can view all analytics events" ON public.analytics_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();