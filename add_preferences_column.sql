-- Add preferences column to user_profiles table if it doesn't exist
-- This migration ensures the preferences column is available for storing user preferences as JSON

-- Check if the column exists and add it if it doesn't
DO $$ 
BEGIN
    -- Check if the preferences column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'preferences'
        AND table_schema = 'public'
    ) THEN
        -- Add the preferences column
        ALTER TABLE public.user_profiles 
        ADD COLUMN preferences JSONB DEFAULT NULL;
        
        RAISE NOTICE 'Added preferences column to user_profiles table';
    ELSE
        RAISE NOTICE 'Preferences column already exists in user_profiles table';
    END IF;
END $$;

-- Update the column comment for documentation
COMMENT ON COLUMN public.user_profiles.preferences IS 'JSON object storing user preferences including dashboard, notifications, health, and privacy settings';

-- Create an index on the preferences column for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences 
ON public.user_profiles USING GIN (preferences);

-- Example of the expected JSON structure:
/*
{
  "dashboard": {
    "default_view": "kids|adult",
    "theme": "light|dark|auto", 
    "language": "en"
  },
  "notifications": {
    "email": true,
    "sms": false,
    "push": true,
    "meal_reminders": true,
    "health_tips": true,
    "family_updates": true,
    "reminder_times": {
      "breakfast": "08:00",
      "lunch": "12:00",
      "dinner": "18:00"
    }
  },
  "health": {
    "units": {
      "weight": "kg|lbs",
      "height": "cm|ft", 
      "temperature": "celsius|fahrenheit"
    },
    "goals": {
      "daily_calories": 2000,
      "daily_water": 8,
      "weekly_exercise": 150
    },
    "tracking": {
      "auto_log_meals": false,
      "sync_fitness_apps": false,
      "share_with_family": true
    }
  },
  "privacy": {
    "profile_visibility": "public|family|private",
    "data_sharing": false,
    "analytics": true
  }
}
*/