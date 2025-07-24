
-- Create table for saved executive summaries
CREATE TABLE public.saved_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  submission_id UUID REFERENCES public.submissions(id) NOT NULL,
  summary_type TEXT NOT NULL DEFAULT 'executive',
  summary_data JSONB NOT NULL DEFAULT '{}',
  shared_url TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.saved_summaries ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved summaries
CREATE POLICY "Users can view their own saved summaries" 
  ON public.saved_summaries 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own saved summaries
CREATE POLICY "Users can create their own saved summaries" 
  ON public.saved_summaries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved summaries
CREATE POLICY "Users can update their own saved summaries" 
  ON public.saved_summaries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own saved summaries
CREATE POLICY "Users can delete their own saved summaries" 
  ON public.saved_summaries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Public can view summaries that are marked as public and have a shared_url
CREATE POLICY "Public can view shared summaries" 
  ON public.saved_summaries 
  FOR SELECT 
  USING (is_public = true AND shared_url IS NOT NULL);

-- Admins can manage all saved summaries
CREATE POLICY "Admins can manage all saved summaries" 
  ON public.saved_summaries 
  FOR ALL 
  USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_saved_summaries_updated_at
  BEFORE UPDATE ON public.saved_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
