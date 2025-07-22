
-- Add email tracking and compliance columns to email_sequence_queue
ALTER TABLE public.email_sequence_queue 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create unsubscribe tracking table
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  temp_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index to prevent duplicate unsubscribes
CREATE UNIQUE INDEX IF NOT EXISTS email_unsubscribes_email_idx ON public.email_unsubscribes(email);

-- Enable RLS
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Create policies for email unsubscribes
CREATE POLICY "Allow public access to unsubscribes" 
ON public.email_unsubscribes 
FOR ALL 
USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS email_sequence_queue_status_scheduled_idx ON public.email_sequence_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS email_sequence_queue_temp_id_sequence_idx ON public.email_sequence_queue(temp_id, sequence_type);

-- Create function to check if email is unsubscribed
CREATE OR REPLACE FUNCTION public.is_email_unsubscribed(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_unsubscribes 
    WHERE email = email_address
  );
END;
$$;

-- Create function to add unsubscribe
CREATE OR REPLACE FUNCTION public.add_email_unsubscribe(
  email_address TEXT,
  unsubscribe_reason TEXT DEFAULT NULL,
  submission_temp_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.email_unsubscribes (email, reason, temp_id)
  VALUES (email_address, unsubscribe_reason, submission_temp_id)
  ON CONFLICT (email) DO NOTHING;
  
  -- Cancel any pending email sequences for this email
  UPDATE public.email_sequence_queue 
  SET status = 'cancelled', 
      unsubscribed_at = now()
  WHERE contact_email = email_address 
  AND status = 'pending';
END;
$$;
