-- Create engagement events table for detailed interaction tracking
CREATE TABLE public.user_engagement_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add engagement scoring fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN engagement_score INTEGER DEFAULT 0,
ADD COLUMN last_action_plan_visit TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_time_spent INTEGER DEFAULT 0,
ADD COLUMN return_visits INTEGER DEFAULT 0,
ADD COLUMN high_intent_lead BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX idx_engagement_events_user_id ON public.user_engagement_events(user_id);
CREATE INDEX idx_engagement_events_type ON public.user_engagement_events(event_type);
CREATE INDEX idx_engagement_events_submission ON public.user_engagement_events(submission_id);
CREATE INDEX idx_engagement_events_created_at ON public.user_engagement_events(created_at);

-- Enable RLS on the new table
ALTER TABLE public.user_engagement_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_engagement_events
CREATE POLICY "Users can view their own engagement events"
ON public.user_engagement_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own engagement events"
ON public.user_engagement_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all engagement events"
ON public.user_engagement_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND (users.raw_user_meta_data->>'role') = 'admin'
  )
);

-- Create function to calculate engagement score
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(user_events JSONB[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_score INTEGER := 0;
  event_record JSONB;
  event_type TEXT;
  score_map JSONB := '{
    "action_plan_viewed": 10,
    "action_interaction": 25,
    "tab_navigation": 5,
    "time_spent_2min": 15,
    "time_spent_5min": 25,
    "next_steps_viewed": 20,
    "return_visit": 30,
    "cta_interaction": 35,
    "session_end": 5
  }'::jsonb;
BEGIN
  FOREACH event_record IN ARRAY user_events
  LOOP
    event_type := event_record->>'event_type';
    total_score := total_score + COALESCE((score_map->>event_type)::INTEGER, 0);
  END LOOP;
  
  -- Cap the score at 100
  RETURN LEAST(total_score, 100);
END;
$$;

-- Create function to update engagement score
CREATE OR REPLACE FUNCTION public.update_engagement_score(p_user_id UUID, p_event_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_score INTEGER;
  event_points INTEGER;
  new_score INTEGER;
  score_map JSONB := '{
    "action_plan_viewed": 10,
    "action_interaction": 25,
    "tab_navigation": 5,
    "time_spent_2min": 15,
    "time_spent_5min": 25,
    "next_steps_viewed": 20,
    "return_visit": 30,
    "cta_interaction": 35,
    "session_end": 5
  }'::jsonb;
BEGIN
  -- Get current engagement score
  SELECT COALESCE(engagement_score, 0) INTO current_score
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Get points for this event type
  event_points := COALESCE((score_map->>p_event_type)::INTEGER, 0);
  
  -- Calculate new score (capped at 100)
  new_score := LEAST(current_score + event_points, 100);
  
  -- Update user profile with new engagement data
  INSERT INTO public.user_profiles (
    id, 
    engagement_score, 
    last_action_plan_visit,
    high_intent_lead,
    updated_at
  ) VALUES (
    p_user_id,
    new_score,
    NOW(),
    new_score > 70,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    engagement_score = new_score,
    last_action_plan_visit = NOW(),
    high_intent_lead = new_score > 70,
    updated_at = NOW();
END;
$$;