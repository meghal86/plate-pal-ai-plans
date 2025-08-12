-- Test script to verify user_profiles table is working correctly

-- 1. Test basic table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Test RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Test if the specific user exists in auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- 4. Test if the user has a profile
SELECT 
    id,
    user_id,
    full_name,
    email,
    created_at
FROM public.user_profiles 
WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c';

-- 5. Test the get_user_profile function
SELECT * FROM public.get_user_profile('359ad3fd-70a1-481d-8360-bcc2dc61a55c');

-- 6. Test permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles'
AND grantee IN ('authenticated', 'service_role');

-- 7. Check for any constraint violations
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass;

-- 8. Test a simple select query (this should work without 406 error)
-- Note: This will only work if executed by an authenticated user
-- SELECT * FROM public.user_profiles WHERE user_id = auth.uid();

-- 9. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles';

-- 10. Summary report
SELECT 
    'Table exists' as check_type,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'RLS enabled' as check_type,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'Policies exist' as check_type,
    CASE WHEN EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_profiles') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'Permissions granted' as check_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.role_table_grants 
        WHERE table_name = 'user_profiles' AND grantee = 'authenticated'
    ) THEN 'PASS' ELSE 'FAIL' END as status;