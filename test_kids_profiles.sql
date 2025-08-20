-- Test script to verify kids profiles are working correctly

-- 1. Check if tables exist
SELECT 
    'families' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'families') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'kids_profiles' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_profiles') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'user_profiles' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') 
         THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check table structures
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'kids_profiles' 
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('kids_profiles', 'families')
ORDER BY tablename, policyname;

-- 4. Check functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_or_create_user_family', 'add_kid_profile')
ORDER BY routine_name;

-- 5. Check foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('kids_profiles', 'families', 'user_profiles')
ORDER BY tc.table_name, kcu.column_name;

-- 6. Check data counts
SELECT 
    'Total families' as metric,
    COUNT(*) as count
FROM public.families
UNION ALL
SELECT 
    'Total kids profiles' as metric,
    COUNT(*) as count
FROM public.kids_profiles
UNION ALL
SELECT 
    'Kids with families' as metric,
    COUNT(*) as count
FROM public.kids_profiles
WHERE family_id IS NOT NULL
UNION ALL
SELECT 
    'Users with families' as metric,
    COUNT(*) as count
FROM public.user_profiles
WHERE family_id IS NOT NULL;

-- 7. Check for orphaned records
SELECT 
    'Kids without families' as issue,
    COUNT(*) as count
FROM public.kids_profiles
WHERE family_id IS NULL
UNION ALL
SELECT 
    'Kids without parent users' as issue,
    COUNT(*) as count
FROM public.kids_profiles
WHERE parent_user_id IS NULL
UNION ALL
SELECT 
    'Families without creators' as issue,
    COUNT(*) as count
FROM public.families f
LEFT JOIN auth.users u ON f.created_by = u.id
WHERE u.id IS NULL;

-- 8. Sample data query (if any exists)
SELECT 
    f.name as family_name,
    f.created_by as family_creator,
    kp.name as kid_name,
    kp.birth_date,
    kp.parent_user_id,
    kp.created_at
FROM public.families f
LEFT JOIN public.kids_profiles kp ON f.id = kp.family_id
ORDER BY f.created_at DESC, kp.created_at DESC
LIMIT 10;

-- 9. Test permissions (this will show what the current user can see)
-- Note: This will only work when executed by an authenticated user
-- SELECT * FROM public.kids_profiles WHERE parent_user_id = auth.uid();

-- 10. Summary report
SELECT 
    'Tables created' as check_type,
    CASE WHEN (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_name IN ('families', 'kids_profiles')
    ) = 2 THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'RLS enabled' as check_type,
    CASE WHEN (
        SELECT COUNT(*) FROM pg_class 
        WHERE relname IN ('families', 'kids_profiles') AND relrowsecurity = true
    ) = 2 THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'Policies exist' as check_type,
    CASE WHEN (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename IN ('families', 'kids_profiles')
    ) > 0 THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'Functions exist' as check_type,
    CASE WHEN (
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_name IN ('get_or_create_user_family', 'add_kid_profile')
    ) = 2 THEN 'PASS' ELSE 'FAIL' END as status;