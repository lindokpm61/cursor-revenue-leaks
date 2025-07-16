-- Fix existing data before applying constraints
UPDATE public.temporary_submissions 
SET completion_percentage = LEAST(GREATEST(COALESCE(completion_percentage, 0), 0), 100)
WHERE completion_percentage IS NULL OR completion_percentage < 0 OR completion_percentage > 100;

UPDATE public.temporary_submissions 
SET lead_score = LEAST(GREATEST(lead_score, 0), 100)
WHERE lead_score IS NOT NULL AND (lead_score < 0 OR lead_score > 100);

UPDATE public.temporary_submissions 
SET email_engagement_score = LEAST(GREATEST(COALESCE(email_engagement_score, 0), 0), 100)
WHERE email_engagement_score IS NULL OR email_engagement_score < 0 OR email_engagement_score > 100;

-- Now apply the constraints
ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT completion_percentage_range 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT lead_score_range 
CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));

ALTER TABLE public.temporary_submissions 
ADD CONSTRAINT email_engagement_score_range 
CHECK (email_engagement_score >= 0 AND email_engagement_score <= 100);