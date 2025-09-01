-- VERIFICATION SCRIPT
-- Run this after executing COMPLETE_DATABASE_FIX.sql to verify everything is working

-- 1. Check if both tables exist
SELECT 
    'Table Existence Check' as test_category,
    table_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES ('user_profiles'), ('kids_meal_plans')) as t(table_name);

-- 2. Check RLS status
SELECT 
    'RLS Status Check' as test_category,
    tablename as table_name,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'kids_meal_plans');

-- 3. Check RLS policies
SELECT 
    'RLS Policies Check' as test_category,
    tablename as table_name,
    COUNT(*) || ' policies' as status
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'kids_meal_plans')
GROUP BY tablename;

-- 4. Check permissions
SELECT 
    'Permissions Check' as test_category,
    table_name,
    grantee || ' has ' || string_agg(privilege_type, ', ') as status
FROM information_schema.role_table_grants 
WHERE table_name IN ('user_profiles', 'kids_meal_plans')
AND grantee IN ('authenticated', 'service_role')
GROUP BY table_name, grantee;

-- 5. Check functions exist
SELECT 
    'Functions Check' as test_category,
    routine_name as table_name,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_name IN ('insert_kids_meal_plan', 'get_kids_meal_plans', 'handle_new_user');

-- 6. Check user profiles exist
SELECT 
    'User Profiles Check' as test_category,
    'user_profiles' as table_name,
    COUNT(*) || ' profiles exist' as status
FROM public.user_profiles;

-- 7. Check for users without profiles
SELECT 
    'Missing Profiles Check' as test_category,
    'user_profiles' as table_name,
    COUNT(*) || ' users without profiles' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- 8. Test specific user (the one from the error)
SELECT 
    'Specific User Check' as test_category,
    'user 359ad3fd-70a1-481d-8360-bcc2dc61a55c' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM auth.users WHERE id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c') 
        THEN '✅ USER EXISTS'
        ELSE '❌ USER NOT FOUND'
    END as status
UNION ALL
SELECT 
    'Specific User Profile Check' as test_category,
    'profile for 359ad3fd-70a1-481d-8360-bcc2dc61a55c' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM public.user_profiles WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c') 
        THEN '✅ PROFILE EXISTS'
        ELSE '❌ PROFILE MISSING'
    END as status;

-- 9. Test specific kid (the one from the error)
SELECT 
    'Specific Kid Check' as test_category,
    'kid 71a44ca2-372d-4f99-8178-67b30d5b0897' as table_name,
    COUNT(*) || ' meal plans exist' as status
FROM public.kids_meal_plans 
WHERE kid_id = '71a44ca2-372d-4f99-8178-67b30d5b0897';

-- 10. Overall health summary
SELECT 
    '=== OVERALL HEALTH SUMMARY ===' as summary,
    '' as details,
    '' as action_needed
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('user_profiles', 'kids_meal_plans')) = 2
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_profiles', 'kids_meal_plans')) >= 8
        AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('insert_kids_meal_plan', 'get_kids_meal_plans')) = 2
        THEN '🎉 ALL SYSTEMS OPERATIONAL'
        ELSE '⚠️ ISSUES DETECTED'
    END as summary,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('user_profiles', 'kids_meal_plans')) < 2
        THEN 'Missing tables detected'
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_profiles', 'kids_meal_plans')) < 8
        THEN 'Missing RLS policies detected'
        WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('insert_kids_meal_plan', 'get_kids_meal_plans')) < 2
        THEN 'Missing functions detected'
        ELSE 'All components present'
    END as details,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('user_profiles', 'kids_meal_plans')) = 2
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_profiles', 'kids_meal_plans')) >= 8
        AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('insert_kids_meal_plan', 'get_kids_meal_plans')) = 2
        THEN '✅ No action needed - ready to test application'
        ELSE '❌ Re-run COMPLETE_DATABASE_FIX.sql'
    END as action_needed;