-- Step 1: Create user notification preferences table
CREATE TABLE user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 2: Create diet notifications table
CREATE TABLE diet_notifications (
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

-- Step 3: Create indexes
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_diet_notifications_user_id ON diet_notifications(user_id);
CREATE INDEX idx_diet_notifications_plan_id ON diet_notifications(plan_id);
CREATE INDEX idx_diet_notifications_scheduled_time ON diet_notifications(scheduled_time);

-- Step 4: Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_notifications ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for user_notification_preferences
CREATE POLICY "Users can manage their own notification preferences" ON user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Step 6: Create RLS policies for diet_notifications  
CREATE POLICY "Users can manage their own diet notifications" ON diet_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Step 7: Grant permissions
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT ALL ON diet_notifications TO authenticated;