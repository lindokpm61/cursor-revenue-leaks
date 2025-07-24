-- Add missing email sequence tables

-- Email sequence queue for scheduling emails
CREATE TABLE public.email_sequence_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_id UUID NOT NULL,
  contact_email TEXT NOT NULL,
  sequence_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicates
CREATE UNIQUE INDEX email_sequence_queue_unique_idx ON public.email_sequence_queue(temp_id, sequence_type) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.email_sequence_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for email sequence queue
CREATE POLICY "Allow insert access to email sequence queue" 
ON public.email_sequence_queue 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read access to email sequence queue" 
ON public.email_sequence_queue 
FOR SELECT 
USING (true);

CREATE POLICY "Allow update access to email sequence queue" 
ON public.email_sequence_queue 
FOR UPDATE 
USING (true);

-- Email engagement events for tracking
CREATE TABLE public.email_engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  engagement_score_delta INTEGER DEFAULT 0,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_engagement_events ENABLE ROW LEVEL SECURITY;

-- Create policies for email engagement events
CREATE POLICY "Allow insert access to email engagement events" 
ON public.email_engagement_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read access to email engagement events" 
ON public.email_engagement_events 
FOR SELECT 
USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_email_sequence_queue_updated_at
BEFORE UPDATE ON public.email_sequence_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX email_sequence_queue_temp_id_idx ON public.email_sequence_queue(temp_id);
CREATE INDEX email_sequence_queue_status_idx ON public.email_sequence_queue(status);
CREATE INDEX email_sequence_queue_scheduled_for_idx ON public.email_sequence_queue(scheduled_for);
CREATE INDEX email_engagement_events_temp_id_idx ON public.email_engagement_events(temp_id);
CREATE INDEX email_engagement_events_event_type_idx ON public.email_engagement_events(event_type);