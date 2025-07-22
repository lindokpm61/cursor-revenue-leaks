
-- Create integration_logs table for tracking all integration activities
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  response_data JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_logs table for tracking N8N workflow executions
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

-- Enable RLS on new tables
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for integration_logs
CREATE POLICY "System can create integration logs" 
ON public.integration_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can read integration logs" 
ON public.integration_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can view integration logs" 
ON public.integration_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
  )
);

-- Create policies for automation_logs
CREATE POLICY "System can manage automation logs" 
ON public.automation_logs 
FOR ALL 
USING (true);

CREATE POLICY "Admins can read automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data ->> 'role') = 'admin'
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_logs_submission ON public.integration_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON public.integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_automation_logs_execution_id ON public.automation_logs(n8n_execution_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow_type ON public.automation_logs(workflow_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON public.automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at);

-- Add missing columns to temporary_submissions for proper functionality
ALTER TABLE public.temporary_submissions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS user_classification TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create analytics views for better reporting
CREATE OR REPLACE VIEW public.email_sequence_analytics AS
SELECT 
  sequence_type,
  COUNT(*) as total_sent,
  COUNT(opened_at) as total_opens,
  COUNT(clicked_at) as total_clicks,
  ROUND(COUNT(opened_at)::decimal / COUNT(*) * 100, 2) as open_rate,
  ROUND(COUNT(clicked_at)::decimal / COUNT(*) * 100, 2) as click_rate,
  DATE_TRUNC('week', created_at) as week
FROM public.email_sequence_queue 
WHERE status = 'sent'
GROUP BY sequence_type, DATE_TRUNC('week', created_at)
ORDER BY week DESC, sequence_type;

-- Create abandonment analytics view
CREATE OR REPLACE VIEW public.abandonment_analytics AS
WITH step_stats AS (
  SELECT 
    current_step,
    COUNT(*) as total_at_step,
    COUNT(CASE WHEN steps_completed > current_step THEN 1 END) as progressed_from_step,
    COUNT(CASE WHEN converted_to_user_id IS NOT NULL THEN 1 END) as converted_from_step,
    AVG(recovery_potential) as avg_recovery_potential
  FROM public.temporary_submissions 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY current_step
)
SELECT 
  current_step,
  total_at_step,
  progressed_from_step,
  converted_from_step,
  ROUND((total_at_step - progressed_from_step)::decimal / total_at_step * 100, 2) as abandonment_rate,
  ROUND(converted_from_step::decimal / total_at_step * 100, 2) as conversion_rate,
  avg_recovery_potential
FROM step_stats
ORDER BY current_step;

-- Create database maintenance function
CREATE OR REPLACE FUNCTION public.perform_database_cleanup()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Archive old converted submissions (older than 30 days)
  UPDATE public.temporary_submissions 
  SET archived_at = NOW()
  WHERE converted_to_user_id IS NOT NULL 
  AND conversion_completed_at < NOW() - INTERVAL '30 days'
  AND archived_at IS NULL;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Delete expired unconverted submissions
  DELETE FROM public.temporary_submissions 
  WHERE expires_at < NOW() 
  AND converted_to_user_id IS NULL;
  
  -- Clean up old email sequence queue entries (older than 7 days)
  DELETE FROM public.email_sequence_queue 
  WHERE status = 'sent' 
  AND sent_at < NOW() - INTERVAL '7 days';
  
  RETURN cleanup_count;
END;
$$;
