-- Add separate CRM tracking columns for persons and opportunities
ALTER TABLE public.submissions 
ADD COLUMN crm_person_id TEXT,
ADD COLUMN crm_opportunity_id TEXT;

-- Create separate person tracking table for users
CREATE TABLE public.crm_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crm_person_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(crm_person_id)
);

-- Enable RLS for crm_persons
ALTER TABLE public.crm_persons ENABLE ROW LEVEL SECURITY;

-- Create policies for crm_persons
CREATE POLICY "Users can view their own CRM person data" 
ON public.crm_persons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CRM person data" 
ON public.crm_persons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage CRM person data" 
ON public.crm_persons 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all CRM person data" 
ON public.crm_persons 
FOR ALL 
USING (is_admin());

-- Create updated_at trigger for crm_persons
CREATE TRIGGER update_crm_persons_updated_at
BEFORE UPDATE ON public.crm_persons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();