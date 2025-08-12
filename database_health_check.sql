-- Database Health Check and Fix Script
-- This script diagnoses and fixes common database issues

-- 1. Check if user_profiles table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'user_profiles table does not exist - needs to be created';
    ELSE
        RAISE NOTICE 'user_profiles table exists';
    END IF;
END $$;

-- 2. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Check table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles';

-- 4. Check if there are any users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN up.user_id IS NULL THEN 'Missing Profile' ELSE 'Has Profile' END as profile_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- 5. Check for any constraint violations
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass;

-- 6. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';

-- 7. Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- 8. Test RLS by simulating a query (this will show what policies are active)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.user_profiles WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- 9. Check if the specific user exists
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- 10. Check if the user has a profile
SELECT 
    id,
    user_id,
    full_name,
    email,
    created_at,
    updated_at
FROM public.user_profiles 
WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';