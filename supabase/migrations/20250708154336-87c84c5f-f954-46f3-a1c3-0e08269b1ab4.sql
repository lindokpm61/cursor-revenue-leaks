-- Update user_profiles table to support multi-company user architecture
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS actual_company_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS actual_role TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS business_model TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_classification TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_companies_analyzed INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS unique_industries_analyzed INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_portfolio_value BIGINT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_submission_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS most_recent_submission_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS partnership_qualified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS enterprise_qualified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS high_value_user BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'standard';

-- Create user_company_relationships table to track relationships between users and analyzed companies
CREATE TABLE IF NOT EXISTS user_company_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  analyzed_company_name TEXT NOT NULL,
  relationship_type TEXT, -- client, employer, portfolio, prospect, division
  engagement_context TEXT, -- paid_analysis, due_diligence, internal_review
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_arr BIGINT,
  analysis_value_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_company_relationships
ALTER TABLE user_company_relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_company_relationships
CREATE POLICY "Users can view their own company relationships" 
ON user_company_relationships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company relationships" 
ON user_company_relationships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company relationships" 
ON user_company_relationships 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all company relationships" 
ON user_company_relationships 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND (raw_user_meta_data->>'role')::text = 'admin'
));

-- Create function to analyze user patterns and auto-classify users
CREATE OR REPLACE FUNCTION public.analyze_user_pattern(user_email TEXT)
RETURNS TABLE(
  user_type TEXT,
  business_model TEXT,
  value_tier TEXT,
  total_companies INTEGER,
  unique_industries INTEGER,
  total_arr BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_domain TEXT;
  company_count INTEGER;
  industry_count INTEGER;
  total_revenue BIGINT;
  has_matching_domain BOOLEAN;
BEGIN
  -- Extract email domain
  email_domain := split_part(user_email, '@', 2);
  
  -- Get submission statistics
  SELECT 
    COUNT(DISTINCT company_name),
    COUNT(DISTINCT industry),
    COALESCE(SUM(current_arr), 0),
    EXISTS(
      SELECT 1 FROM submissions s 
      WHERE s.contact_email = user_email 
      AND LOWER(s.company_name) LIKE '%' || LOWER(split_part(email_domain, '.', 1)) || '%'
    )
  INTO company_count, industry_count, total_revenue, has_matching_domain
  FROM submissions 
  WHERE contact_email = user_email;
  
  -- Classify user based on patterns
  IF company_count >= 3 AND NOT has_matching_domain THEN
    -- Consultant/Agency pattern
    RETURN QUERY SELECT 
      'consultant'::TEXT,
      'consulting'::TEXT,
      CASE 
        WHEN total_revenue > 50000000 THEN 'enterprise'
        WHEN total_revenue > 10000000 THEN 'premium'
        ELSE 'standard'
      END::TEXT,
      company_count,
      industry_count,
      total_revenue;
  ELSIF company_count >= 2 AND has_matching_domain THEN
    -- Enterprise multi-division pattern
    RETURN QUERY SELECT 
      'enterprise'::TEXT,
      'internal'::TEXT,
      'high'::TEXT,
      company_count,
      industry_count,
      total_revenue;
  ELSIF company_count >= 4 AND industry_count >= 2 THEN
    -- Investor/PE pattern
    RETURN QUERY SELECT 
      'investor'::TEXT,
      'investment'::TEXT,
      'very_high'::TEXT,
      company_count,
      industry_count,
      total_revenue;
  ELSE
    -- Standard user pattern
    RETURN QUERY SELECT 
      'standard'::TEXT,
      'internal'::TEXT,
      CASE 
        WHEN total_revenue > 5000000 THEN 'premium'
        ELSE 'standard'
      END::TEXT,
      company_count,
      industry_count,
      total_revenue;
  END IF;
END;
$$;

-- Create function to link submissions to user after account creation
CREATE OR REPLACE FUNCTION public.link_submissions_to_user(
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_record RECORD;
  linked_count INTEGER := 0;
BEGIN
  -- Link all submissions with matching email to the user
  FOR submission_record IN 
    SELECT * FROM submissions 
    WHERE contact_email = p_user_email 
    AND (user_id IS NULL OR user_id = p_user_id)
  LOOP
    -- Update submission with user_id
    UPDATE submissions 
    SET user_id = p_user_id, updated_at = NOW()
    WHERE id = submission_record.id;
    
    -- Create company relationship record
    INSERT INTO user_company_relationships (
      user_id,
      submission_id,
      analyzed_company_name,
      relationship_type,
      engagement_context,
      company_arr,
      analysis_value_score
    ) VALUES (
      p_user_id,
      submission_record.id,
      submission_record.company_name,
      -- Determine relationship type based on pattern analysis
      CASE 
        WHEN EXISTS(SELECT 1 FROM public.analyze_user_pattern(p_user_email) WHERE user_type = 'consultant') THEN 'client'
        WHEN EXISTS(SELECT 1 FROM public.analyze_user_pattern(p_user_email) WHERE user_type = 'enterprise') THEN 'division'
        WHEN EXISTS(SELECT 1 FROM public.analyze_user_pattern(p_user_email) WHERE user_type = 'investor') THEN 'portfolio'
        ELSE 'employer'
      END,
      'revenue_analysis',
      submission_record.current_arr,
      submission_record.lead_score
    ) ON CONFLICT DO NOTHING;
    
    linked_count := linked_count + 1;
  END LOOP;
  
  -- Update user profile with aggregated data
  UPDATE user_profiles 
  SET 
    total_companies_analyzed = (
      SELECT COUNT(DISTINCT analyzed_company_name) 
      FROM user_company_relationships 
      WHERE user_id = p_user_id
    ),
    unique_industries_analyzed = (
      SELECT COUNT(DISTINCT s.industry) 
      FROM user_company_relationships ucr
      JOIN submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id AND s.industry IS NOT NULL
    ),
    total_portfolio_value = (
      SELECT COALESCE(SUM(company_arr), 0) 
      FROM user_company_relationships 
      WHERE user_id = p_user_id
    ),
    first_submission_date = (
      SELECT MIN(s.created_at) 
      FROM user_company_relationships ucr
      JOIN submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id
    ),
    most_recent_submission_date = (
      SELECT MAX(s.created_at) 
      FROM user_company_relationships ucr
      JOIN submissions s ON ucr.submission_id = s.id
      WHERE ucr.user_id = p_user_id
    ),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN linked_count;
END;
$$;