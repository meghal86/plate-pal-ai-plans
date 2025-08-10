-- Drop existing policies and recreate them with better conditions
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON user_notification_preferences;

-- Create simpler, more permissive policies
CREATE POLICY "Enable all operations for authenticated users on their own preferences" 
ON user_notification_preferences
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure the table has the right permissions
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;