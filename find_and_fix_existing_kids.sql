-- Find and Fix Existing Kids Data
-- This script will locate your existing kids and fix the relationships

-- Step 1: Find your user ID and current data
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
    user_record RECORD;
    profile_record RECORD;
    family_record RECORD;
    kid_record RECORD;
    kids_found INTEGER := 0;
BEGIN
    -- Find your user
    SELECT id, email INTO user_record
    FROM auth.users 
    WHERE email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL
    
    IF user_record.id IS NULL THEN
        RAISE NOTICE 'ERROR: User not found with email. Please check the email address.';
        RETURN;
    END IF;
    
    RAISE NOTICE '=== USER FOUND ===';
    RAISE NOTICE 'User ID: %', user_record.id;
    RAISE NOTICE 'Email: %', user_record.email;
    
    -- Check user profile
    SELECT * INTO profile_record
    FROM public.user_profiles 
    WHERE user_id = user_record.id;
    
    IF profile_record.user_id IS NULL THEN
        RAISE NOTICE 'WARNING: No user profile found. Creating one...';
        INSERT INTO public.user_profiles (user_id, full_name, email)
        VALUES (user_record.id, split_part(user_record.email, '@', 1), user_record.email);
        
        SELECT * INTO profile_record
        FROM public.user_profiles 
        WHERE user_id = user_record.id;
    END IF;
    
    RAISE NOTICE '=== USER PROFILE ===';
    RAISE NOTICE 'Profile ID: %', profile_record.id;
    RAISE NOTICE 'Full Name: %', profile_record.full_name;
    RAISE NOTICE 'Family ID: %', COALESCE(profile_record.family_id::text, 'NULL');
    
    -- Look for existing kids in ALL possible ways
    RAISE NOTICE '=== SEARCHING FOR EXISTING KIDS ===';
    
    -- Method 1: Kids linked to user directly (old way)
    FOR kid_record IN 
        SELECT *, 'direct_user_link' as found_method
        FROM public.kids_profiles 
        WHERE parent_user_id = user_record.id
    LOOP
        kids_found := kids_found + 1;
        RAISE NOTICE 'FOUND KID #%: % (ID: %, Method: %, Family ID: %)', 
            kids_found, kid_record.name, kid_record.id, kid_record.found_method, 
            COALESCE(kid_record.family_id::text, 'NULL');
    END LOOP;
    
    -- Method 2: Kids linked through family (new way)
    IF profile_record.family_id IS NOT NULL THEN
        FOR kid_record IN 
            SELECT *, 'family_link' as found_method
            FROM public.kids_profiles 
            WHERE family_id = profile_record.family_id
        LOOP
            -- Check if we already counted this kid
            IF NOT EXISTS (
                SELECT 1 FROM public.kids_profiles 
                WHERE id = kid_record.id AND parent_user_id = user_record.id
            ) THEN
                kids_found := kids_found + 1;
                RAISE NOTICE 'FOUND KID #%: % (ID: %, Method: %, Parent User: %)', 
                    kids_found, kid_record.name, kid_record.id, kid_record.found_method,
                    COALESCE(kid_record.parent_user_id::text, 'NULL');
            END IF;
        END LOOP;
    END IF;
    
    -- Method 3: Kids that might be orphaned (no family_id but have parent_user_id)
    FOR kid_record IN 
        SELECT *, 'orphaned' as found_method
        FROM public.kids_profiles 
        WHERE parent_user_id = user_record.id AND family_id IS NULL
    LOOP
        RAISE NOTICE 'FOUND ORPHANED KID: % (ID: %, needs family link)', 
            kid_record.name, kid_record.id;
    END LOOP;
    
    -- Method 4: Search by similar names or any other pattern
    -- This is a broader search in case kids got disconnected
    FOR kid_record IN 
        SELECT *, 'broad_search' as found_method
        FROM public.kids_profiles 
        WHERE parent_user_id IS NULL 
        AND family_id IS NULL
        AND created_at > (user_record.id::text || '00000000-0000-0000-0000-000000000000')::timestamp - interval '1 year'
        LIMIT 5
    LOOP
        RAISE NOTICE 'FOUND POTENTIAL KID: % (ID: %, Created: %, might be yours)', 
            kid_record.name, kid_record.id, kid_record.created_at;
    END LOOP;
    
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Total kids found with direct links: %', kids_found;
    
    -- If no family exists, create one
    IF profile_record.family_id IS NULL THEN
        RAISE NOTICE 'Creating family for user...';
        INSERT INTO public.families (name, created_by)
        VALUES (COALESCE(profile_record.full_name, 'My') || '''s Family', user_record.id)
        RETURNING id INTO family_record.id;
        
        UPDATE public.user_profiles 
        SET family_id = family_record.id 
        WHERE user_id = user_record.id;
        
        RAISE NOTICE 'Created family with ID: %', family_record.id;
    ELSE
        family_record.id := profile_record.family_id;
    END IF;
    
    -- Fix any orphaned kids by linking them to the family
    UPDATE public.kids_profiles 
    SET family_id = family_record.id
    WHERE parent_user_id = user_record.id AND family_id IS NULL;
    
    GET DIAGNOSTICS kids_found = ROW_COUNT;
    IF kids_found > 0 THEN
        RAISE NOTICE 'Fixed % orphaned kids by linking them to family', kids_found;
    END IF;
    
    -- Final count
    SELECT COUNT(*) INTO kids_found
    FROM public.kids_profiles 
    WHERE family_id = family_record.id OR parent_user_id = user_record.id;
    
    RAISE NOTICE '=== FINAL RESULT ===';
    RAISE NOTICE 'User: % (%)', user_record.email, user_record.id;
    RAISE NOTICE 'Family: %', family_record.id;
    RAISE NOTICE 'Total kids now linked: %', kids_found;
    
END $$;

-- Step 2: Show the final state
-- Replace 'your-email@example.com' with your actual email
SELECT 
    'FINAL VERIFICATION' as status,
    au.email as user_email,
    au.id as user_id,
    up.family_id,
    f.name as family_name,
    kp.id as kid_id,
    kp.name as kid_name,
    kp.birth_date,
    kp.parent_user_id,
    kp.family_id as kid_family_id,
    kp.created_at as kid_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.families f ON up.family_id = f.id
LEFT JOIN public.kids_profiles kp ON (f.id = kp.family_id OR au.id = kp.parent_user_id)
WHERE au.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
ORDER BY kp.created_at;

-- Step 3: Test the query that the frontend uses
-- Replace 'your-email@example.com' with your actual email
WITH user_info AS (
    SELECT au.id as user_id, up.family_id
    FROM auth.users au
    JOIN public.user_profiles up ON au.id = up.user_id
    WHERE au.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
)
SELECT 
    'FRONTEND QUERY TEST' as test_type,
    kp.*
FROM user_info ui
JOIN public.kids_profiles kp ON kp.family_id = ui.family_id
ORDER BY kp.created_at;

-- Step 4: Check RLS policies are not blocking access
SELECT 
    'RLS POLICY CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'kids_profiles'
ORDER BY policyname;

-- Step 5: If you want to create test kids (uncomment if needed)
/*
INSERT INTO public.kids_profiles (
    family_id, 
    parent_user_id, 
    name, 
    birth_date, 
    gender
) 
SELECT 
    up.family_id,
    au.id,
    'Test Child ' || generate_series(1, 2),
    '2015-01-01'::date + (generate_series(1, 2) * interval '1 year'),
    'other'
FROM auth.users au
JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
AND up.family_id IS NOT NULL;
*/