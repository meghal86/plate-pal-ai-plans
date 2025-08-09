-- Debug script for kids_meal_plans table issues

-- First, check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'kids_meal_plans'
) as table_exists;

-- If table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kids_meal_plans'
ORDER BY ordinal_position;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'kids_meal_plans';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'kids_meal_plans';

-- Temporarily disable RLS for testing (ONLY FOR DEBUGGING)
-- ALTER TABLE kids_meal_plans DISABLE ROW LEVEL SECURITY;

-- Check if there are any records in the table
SELECT COUNT(*) as total_records FROM kids_meal_plans;

-- Check current user context
SELECT 
    current_user as current_user,
    session_user as session_user,
    auth.uid() as auth_uid;

-- Test basic insert (you can uncomment this to test)
-- INSERT INTO kids_meal_plans (kid_id, title, description, duration, plan_data, preferences, created_by)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- dummy kid_id
--     'Test Plan',
--     'Test Description',
--     7,
--     '{"test": true}',
--     '{"test": true}',
--     auth.uid()
-- );