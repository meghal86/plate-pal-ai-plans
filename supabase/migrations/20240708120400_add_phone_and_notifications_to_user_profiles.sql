-- Add phone number and notification preferences to user profiles
ALTER TABLE user_profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "email": true,
  "sms": false,
  "push": true,
  "meal_reminders": true,
  "health_tips": true,
  "family_updates": true
}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.phone_number IS 'User phone number with country code for SMS notifications (e.g., +1 555 123 4567)';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'JSON object containing user notification preferences'; 