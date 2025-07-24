-- Create automation_logs table for N8N workflow tracking
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_type TEXT NOT NULL,
  n8n_execution_id TEXT,
  data_sent JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_engagement_events table for Smartlead tracking
CREATE TABLE IF NOT EXISTS public.email_engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_id TEXT,
  event_type TEXT NOT NULL,
  email_id TEXT,
  campaign_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  engagement_score_delta INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_engagement_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage automation logs" 
ON public.automation_logs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data->>'role') = 'admin'
));

CREATE POLICY "System can manage automation logs" 
ON public.automation_logs 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage email engagement events" 
ON public.email_engagement_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data->>'role') = 'admin'
));

CREATE POLICY "System can manage email engagement events" 
ON public.email_engagement_events 
FOR ALL 
USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_execution_id ON public.automation_logs(n8n_execution_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow_type ON public.automation_logs(workflow_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_engagement_temp_id ON public.email_engagement_events(temp_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_event_type ON public.email_engagement_events(event_type);