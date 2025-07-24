-- Temporary submissions for anonymous users with email automation support
CREATE TABLE temporary_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_id TEXT UNIQUE NOT NULL, -- Browser-generated identifier
  session_id TEXT, -- Browser session tracking
  
  -- Contact Information (captured in Step 1)
  email TEXT,
  company_name TEXT,
  industry TEXT,
  
  -- Calculator Progress Tracking
  current_step INTEGER DEFAULT 1,
  steps_completed INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  
  -- Calculator Data (JSONB for flexibility)
  calculator_data JSONB DEFAULT '{}',
  
  -- Calculated Results (when complete)
  total_revenue_leak BIGINT,
  recovery_potential BIGINT,
  lead_score INTEGER,
  
  -- Email Automation Tracking
  email_sequences_triggered JSONB DEFAULT '[]', -- Track which sequences sent
  last_email_sent_at TIMESTAMP,
  email_engagement_score INTEGER DEFAULT 0,
  
  -- CRM Integration Status
  twenty_crm_contact_id TEXT, -- Reference to Twenty CRM contact
  smartlead_campaign_ids JSONB DEFAULT '[]', -- Active Smartlead campaigns
  n8n_workflow_status JSONB DEFAULT '{}', -- N8N automation status
  
  -- Tracking Information
  user_agent TEXT,
  ip_address TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Lifecycle Management
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Conversion Tracking
  converted_to_user_id UUID REFERENCES auth.users(id),
  conversion_completed_at TIMESTAMP,
  
  -- Engagement Tracking
  page_views INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  return_visits INTEGER DEFAULT 0,
  calculator_interactions INTEGER DEFAULT 0
);

-- Performance indexes
CREATE INDEX idx_temp_submissions_temp_id ON temporary_submissions(temp_id);
CREATE INDEX idx_temp_submissions_email ON temporary_submissions(email);
CREATE INDEX idx_temp_submissions_created_at ON temporary_submissions(created_at);
CREATE INDEX idx_temp_submissions_last_activity ON temporary_submissions(last_activity_at);
CREATE INDEX idx_temp_submissions_expires_at ON temporary_submissions(expires_at);

-- Email sequence queue for delayed/scheduled emails
CREATE TABLE email_sequence_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_id TEXT REFERENCES temporary_submissions(temp_id),
  sequence_type TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  contact_email TEXT NOT NULL,
  contact_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, sent, failed, cancelled
  n8n_execution_id TEXT, -- Track N8N workflow execution
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

-- Performance indexes for email queue
CREATE INDEX idx_email_queue_scheduled ON email_sequence_queue(scheduled_for, status);
CREATE INDEX idx_email_queue_temp_id ON email_sequence_queue(temp_id);
CREATE INDEX idx_email_queue_status ON email_sequence_queue(status);

-- Enable RLS on temporary_submissions
ALTER TABLE temporary_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for temporary_submissions
CREATE POLICY "Anyone can create temporary submissions" 
ON temporary_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own temporary submissions by temp_id" 
ON temporary_submissions 
FOR SELECT 
USING (true); -- Allow reading by temp_id for anonymous users

CREATE POLICY "Users can update their own temporary submissions by temp_id" 
ON temporary_submissions 
FOR UPDATE 
USING (true); -- Allow updating by temp_id for anonymous users

CREATE POLICY "Admins can view all temporary submissions" 
ON temporary_submissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data ->> 'role') = 'admin'
));

-- Enable RLS on email_sequence_queue
ALTER TABLE email_sequence_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_sequence_queue
CREATE POLICY "System can manage email sequence queue" 
ON email_sequence_queue 
FOR ALL 
USING (true); -- Allow system access for email automation

CREATE POLICY "Admins can view all email sequences" 
ON email_sequence_queue 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data ->> 'role') = 'admin'
));

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_temp_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on temporary_submissions updates
CREATE TRIGGER update_temp_submission_timestamp_trigger
  BEFORE UPDATE ON temporary_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_temp_submission_timestamp();

-- Function to clean up expired temporary submissions
CREATE OR REPLACE FUNCTION cleanup_expired_temp_submissions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired temporary submissions and related email queue entries
  DELETE FROM email_sequence_queue 
  WHERE temp_id IN (
    SELECT temp_id FROM temporary_submissions 
    WHERE expires_at < NOW() AND converted_to_user_id IS NULL
  );
  
  DELETE FROM temporary_submissions 
  WHERE expires_at < NOW() AND converted_to_user_id IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;