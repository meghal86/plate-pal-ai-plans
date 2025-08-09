-- Add preferences column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Create index for faster queries on preferences
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences ON user_profiles USING GIN (preferences);

-- Update existing users to have default preferences
UPDATE user_profiles 
SET preferences = '{}'::jsonb 
WHERE preferences IS NULL;