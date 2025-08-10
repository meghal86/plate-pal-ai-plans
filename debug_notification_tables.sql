-- Debug: Check if tables exist and their structure
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('user_notification_preferences', 'diet_notifications');

-- Debug: Check table structure
\d user_notification_preferences;
\d diet_notifications;

-- Debug: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_notification_preferences', 'diet_notifications');

-- Debug: Check current user
SELECT auth.uid() as current_user_id;

-- Debug: Try to select from the table (this should work if RLS is correct)
SELECT * FROM user_notification_preferences WHERE user_id = auth.uid();

-- Debug: Check if we can insert (test query - don't run this if you don't want test data)
-- INSERT INTO user_notification_preferences (user_id, preferences) 
-- VALUES (auth.uid(), '{"test": true}'::jsonb);