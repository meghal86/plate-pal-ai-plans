-- Debug Kids Profiles Issue - Step by step diagnosis

-- 1. Check if the user exists and has a profile
SELECT 
    'User Check' as step,
    au.id as user_id,
    au.email,
    up.full_name,
    up.family_id,
    up.created_at as profile_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.email = 'YOUR_EMAIL_HERE' -- Replace with your actual email
ORDER BY au.created_at DESC;

-- 2. Check if families table exists and has data
SELECT 
    'Families Check' as step,
    COUNT(*) as total_families,
    COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as families_with_creators
FROM public.families;

-- 3. Check if kids_profiles table exists and has data
SELECT 
    'Kids Profiles Check' as step,
    COUNT(*) as total_kids,
    COUNT(CASE WHEN family_id IS NOT NULL THEN 1 END) as kids_with_families,
    COUNT(CASE WHEN parent_user_id IS NOT NULL THEN 1 END) as kids_with_parents
FROM public.kids_profiles;

-- 4. Check specific user's family and kids
-- Replace 'YOUR_USER_ID' with your actual user ID
WITH user_info AS (
    SELECT id as user_id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE' -- Replace with your email
)
SELECT 
    'User Family and Kids' as step,
    ui.user_id,
    up.family_id,
    f.name as family_name,
    f.created_by as family_creator,
    COUNT(kp.id) as kids_count
FROM user_info ui
LEFT JOIN public.user_profiles up ON ui.user_id = up.user_id
LEFT JOIN public.families f ON up.family_id = f.id
LEFT JOIN public.kids_profiles kp ON f.id = kp.family_id
GROUP BY ui.user_id, up.family_id, f.name, f.created_by;

-- 5. Check RLS policies are working
SELECT 
    'RLS Policies Check' as step,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('kids_profiles', 'families', 'user_profiles')
ORDER BY tablename, policyname;

-- 6. Check if functions exist
SELECT 
    'Functions Check' as step,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('get_or_create_user_family', 'add_kid_profile')
ORDER BY routine_name;

-- 7. Test the get_or_create_user_family function
-- Replace 'YOUR_USER_ID' with your actual user ID
-- SELECT public.get_or_create_user_family('YOUR_USER_ID') as family_id;

-- 8. Check for any constraint violations or issues
SELECT 
    'Constraint Check' as step,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
    'public.kids_profiles'::regclass,
    'public.families'::regclass,
    'public.user_profiles'::regclass
)
ORDER BY conrelid::regclass::text, conname;

-- 9. Check table permissions
SELECT 
    'Permissions Check' as step,
    schemaname,
    tablename,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('kids_profiles', 'families', 'user_profiles')
    AND grantee IN ('authenticated', 'service_role', 'public')
ORDER BY table_name, grantee, privilege_type;

-- 10. Sample query to see what data exists (if any)
SELECT 
    'Sample Data' as step,
    'families' as table_name,
    f.id,
    f.name,
    f.created_by,
    f.created_at,
    au.email as creator_email
FROM public.families f
LEFT JOIN auth.users au ON f.created_by = au.id
ORDER BY f.created_at DESC
LIMIT 5;

SELECT 
    'Sample Data' as step,
    'kids_profiles' as table_name,
    kp.id,
    kp.name,
    kp.family_id,
    kp.parent_user_id,
    kp.created_at,
    f.name as family_name,
    au.email as parent_email
FROM public.kids_profiles kp
LEFT JOIN public.families f ON kp.family_id = f.id
LEFT JOIN auth.users au ON kp.parent_user_id = au.id
ORDER BY kp.created_at DESC
LIMIT 5;

-- 11. Check if there are any kids profiles that might be orphaned
SELECT 
    'Orphaned Kids Check' as step,
    COUNT(*) as orphaned_kids_count
FROM public.kids_profiles kp
LEFT JOIN public.families f ON kp.family_id = f.id
WHERE f.id IS NULL AND kp.family_id IS NOT NULL;

-- 12. Check if user_profiles table has the family_id column
SELECT 
    'User Profiles Schema Check' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
    AND column_name IN ('family_id', 'user_id', 'full_name')
ORDER BY ordinal_position;