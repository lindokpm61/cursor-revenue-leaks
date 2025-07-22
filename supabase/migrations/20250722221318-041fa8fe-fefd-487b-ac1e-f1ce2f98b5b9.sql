
-- Create comprehensive integration_logs table for monitoring all integrations
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type TEXT NOT NULL, -- 'twenty_crm_person', 'twenty_crm_company', 'twenty_crm_opportunity', 'smartlead', 'n8n_workflow'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'retrying'
  submission_id UUID,
  temp_id UUID,
  user_id UUID,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON public.integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_logs_submission_id ON public.integration_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_temp_id ON public.integration_logs(temp_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_user_id ON public.integration_logs(user_id);

-- Enable RLS
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage all integration logs" 
ON public.integration_logs 
FOR ALL 
USING (public.is_admin_user());

CREATE POLICY "System can manage integration logs" 
ON public.integration_logs 
FOR ALL 
USING (true);

-- Create conversion_events table for tracking user journey and conversions
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_id UUID,
  temp_id UUID,
  event_type TEXT NOT NULL, -- 'calculator_start', 'step_completed', 'email_captured', 'registration', 'pdf_download', 'booking_attempted'
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON public.conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON public.conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user ON public.conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_temp_id ON public.conversion_events(temp_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON public.conversion_events(created_at);

-- Enable RLS for conversion events
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Create policies for conversion events
CREATE POLICY "Admin users can view all conversion events" 
ON public.conversion_events 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "System can manage conversion events" 
ON public.conversion_events 
FOR ALL 
USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_logs_updated_at
  BEFORE UPDATE ON public.integration_logs
  FOR EACH ROW EXECUTE FUNCTION update_integration_logs_updated_at();
