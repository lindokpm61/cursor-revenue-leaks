-- Create EMAIL_SEQUENCES table for tracking Smartlead campaign performance
CREATE TABLE email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL,
  email_step INTEGER NOT NULL,
  smartlead_campaign_id TEXT,
  smartlead_prospect_id TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE
);

-- Create INTEGRATION_LOGS table for monitoring sync status with external services
CREATE TABLE integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_id UUID REFERENCES submissions(id),
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  response_data JSONB,
  retry_count INTEGER DEFAULT 0
);

-- Create USER_PROFILES table for extended user data and multi-company tracking
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_name TEXT,
  role TEXT DEFAULT 'user',
  user_type TEXT, -- 'consultant', 'enterprise', 'investor', 'standard'
  companies_analyzed INTEGER DEFAULT 0,
  total_opportunity BIGINT DEFAULT 0,
  last_analysis_date TIMESTAMP,
  engagement_tier TEXT DEFAULT 'standard'
);

-- Add performance indexes
CREATE INDEX idx_email_sequences_submission ON email_sequences (submission_id);
CREATE INDEX idx_email_sequences_status ON email_sequences (status);
CREATE INDEX idx_integration_logs_submission ON integration_logs (submission_id);
CREATE INDEX idx_integration_logs_type ON integration_logs (integration_type);
CREATE INDEX idx_user_profiles_type ON user_profiles (user_type);

-- Enable Row Level Security
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin access email sequences" ON email_sequences FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin access integration logs" ON integration_logs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Add trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();