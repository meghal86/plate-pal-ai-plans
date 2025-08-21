-- Test script to verify kids_meal_plans RLS fix

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'kids_meal_plans' 
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'kids_meal_plans';

-- 3. Check RLS policies
SELECT 
    policyname,
    cmd as operation,
    permissive,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'kids_meal_plans'
ORDER BY policyname;

-- 4. Check permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'kids_meal_plans'
AND grantee IN ('authenticated', 'service_role');

-- 5. Check if functions exist
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('insert_kids_meal_plan', 'get_kids_meal_plans')
ORDER BY routine_name;

-- 6. Test function permissions
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name IN ('insert_kids_meal_plan', 'get_kids_meal_plans')
AND grantee = 'authenticated';

-- 7. Check current authentication context
SELECT 
    current_user,
    session_user,
    auth.uid() as authenticated_user_id;

-- 8. Count existing records
SELECT COUNT(*) as total_meal_plans FROM public.kids_meal_plans;

-- 9. Test the insert function (if authenticated)
-- This should work if you're authenticated as a user
/*
SELECT public.insert_kids_meal_plan(
    gen_random_uuid(), -- kid_id
    'Test Plan from SQL',
    'Test Description',
    7,
    '{"test": true, "daily_plans": []}'::jsonb,
    '{"dietary_restrictions": [], "allergies": []}'::jsonb,
    false
) as test_plan_id;
*/

-- 10. Test the get function (if authenticated)
-- This should work if you're authenticated as a user
/*
SELECT * FROM public.get_kids_meal_plans(gen_random_uuid());
*/

-- 11. Summary health check
SELECT 
    'Table exists' as check_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_meal_plans') 
         THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'RLS enabled' as check_name,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'kids_meal_plans') 
         THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'Policies exist' as check_name,
    CASE WHEN EXISTS (SELECT FROM pg_policies WHERE tablename = 'kids_meal_plans') 
         THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'Insert function exists' as check_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'insert_kids_meal_plan') 
         THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'Get function exists' as check_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_kids_meal_plans') 
         THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'Permissions granted' as check_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.role_table_grants 
        WHERE table_name = 'kids_meal_plans' AND grantee = 'authenticated'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 12. Show any existing meal plans (for debugging)
SELECT 
    id,
    kid_id,
    title,
    duration,
    is_active,
    created_by,
    created_at
FROM public.kids_meal_plans 
ORDER BY created_at DESC 
LIMIT 5;