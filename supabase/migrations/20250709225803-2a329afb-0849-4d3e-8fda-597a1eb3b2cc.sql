-- Add missing columns to temporary_submissions table for advanced automation
ALTER TABLE public.temporary_submissions 
ADD COLUMN IF NOT EXISTS user_classification TEXT,
ADD COLUMN IF NOT EXISTS special_handling BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consultant_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attribution_data JSONB DEFAULT '{}';

-- Add missing columns to email_sequence_queue for performance tracking
ALTER TABLE public.email_sequence_queue 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS conversion_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revenue_attributed BIGINT DEFAULT 0;

-- Create email sequence analytics view
CREATE OR REPLACE VIEW public.email_sequence_analytics AS
SELECT 
  sequence_type,
  COUNT(*) as total_sent,
  COUNT(opened_at) as total_opens,
  COUNT(clicked_at) as total_clicks,
  COUNT(conversion_completed_at) as total_conversions,
  SUM(revenue_attributed) as total_revenue,
  ROUND(COUNT(opened_at)::decimal / COUNT(*) * 100, 2) as open_rate,
  ROUND(COUNT(clicked_at)::decimal / COUNT(*) * 100, 2) as click_rate,
  ROUND(COUNT(conversion_completed_at)::decimal / COUNT(*) * 100, 2) as conversion_rate,
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
    AVG(recovery_potential) as avg_recovery_potential,
    SUM(CASE WHEN recovery_potential > 1000000 THEN 1 ELSE 0 END) as high_value_count
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
  avg_recovery_potential,
  high_value_count
FROM step_stats
ORDER BY current_step;

-- Create performance tracking function
CREATE OR REPLACE FUNCTION public.track_email_performance(
  p_sequence_type TEXT,
  p_contact_email TEXT,
  p_event_type TEXT,
  p_revenue_amount BIGINT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_event_type = 'opened' THEN
    UPDATE public.email_sequence_queue 
    SET opened_at = NOW()
    WHERE sequence_type = p_sequence_type 
    AND contact_email = p_contact_email 
    AND opened_at IS NULL;
    
  ELSIF p_event_type = 'clicked' THEN
    UPDATE public.email_sequence_queue 
    SET clicked_at = NOW()
    WHERE sequence_type = p_sequence_type 
    AND contact_email = p_contact_email;
    
  ELSIF p_event_type = 'converted' THEN
    UPDATE public.email_sequence_queue 
    SET conversion_completed_at = NOW(),
        revenue_attributed = p_revenue_amount
    WHERE sequence_type = p_sequence_type 
    AND contact_email = p_contact_email;
  END IF;
END;
$$;

-- Create database cleanup function
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

-- Add archived_at column for soft deletion
ALTER TABLE public.temporary_submissions 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;