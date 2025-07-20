-- Fix temporary_submissions table schema issues

-- Add missing last_updated column
ALTER TABLE temporary_submissions 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the last_updated column for existing records based on created_at
UPDATE temporary_submissions 
SET last_updated = created_at 
WHERE last_updated IS NULL;

-- Add trigger to automatically update last_updated when row is modified
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic last_updated updates
DROP TRIGGER IF EXISTS update_temporary_submissions_last_updated ON temporary_submissions;
CREATE TRIGGER update_temporary_submissions_last_updated
    BEFORE UPDATE ON temporary_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();