-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create diet notifications table
CREATE TABLE IF NOT EXISTS diet_notifications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('daily_plan', 'breakfast', 'lunch', 'dinner', 'snack')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meal_data JSONB,
    day_data JSONB,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_notifications_user_id ON diet_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_notifications_plan_id ON diet_notifications(plan_id);
CREATE INDEX IF NOT EXISTS idx_diet_notifications_scheduled_time ON diet_notifications(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_diet_notifications_is_sent ON diet_notifications(is_sent);

-- Enable RLS (Row Level Security)
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON user_notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for diet_notifications
CREATE POLICY "Users can view their own diet notifications" ON diet_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diet notifications" ON diet_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diet notifications" ON diet_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diet notifications" ON diet_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_notification_preferences
CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification preferences for existing users (optional)
-- This will create default preferences for users who don't have any yet
INSERT INTO user_notification_preferences (user_id, preferences)
SELECT 
    id as user_id,
    '{
        "enabled": true,
        "daily_plan_enabled": true,
        "meal_reminders_enabled": true,
        "daily_plan_time": "08:00",
        "include_recipes_in_daily": false,
        "breakfast_reminder": true,
        "lunch_reminder": true,
        "dinner_reminder": true,
        "snack_reminder": false,
        "breakfast_time": "08:00",
        "lunch_time": "12:00",
        "dinner_time": "18:00",
        "snack_time": "15:00",
        "include_recipes": true,
        "include_calories": true,
        "include_prep_time": true,
        "include_ingredients": false,
        "weekend_notifications": true,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "07:00"
    }'::jsonb as preferences
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences);

-- Grant necessary permissions
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT ALL ON diet_notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;