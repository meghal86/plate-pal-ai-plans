-- Simple test to check if the notification tables are working

-- 1. Check if tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('user_notification_preferences', 'diet_notifications')
ORDER BY table_name;

-- 2. Check current user
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 3. Try to select from user_notification_preferences (should return empty result, not error)
SELECT 
    id,
    user_id,
    preferences,
    created_at
FROM user_notification_preferences 
WHERE user_id = auth.uid();

-- 4. Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_notification_preferences';

-- 5. If the above queries work, try a simple insert test
-- (Uncomment the lines below to test insert)
/*
INSERT INTO user_notification_preferences (user_id, preferences) 
VALUES (
    auth.uid(), 
    '{"enabled": true, "test": true}'::jsonb
) 
ON CONFLICT (user_id) 
DO UPDATE SET 
    preferences = EXCLUDED.preferences,
    updated_at = NOW();
*/