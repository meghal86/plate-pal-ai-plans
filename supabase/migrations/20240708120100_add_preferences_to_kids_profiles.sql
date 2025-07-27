-- Add preferences column to kids_profiles
ALTER TABLE kids_profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb; 