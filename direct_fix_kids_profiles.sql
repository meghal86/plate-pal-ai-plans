-- Direct Fix for Kids Profiles Issue
-- This script will directly check and fix the user's kids profiles

-- Step 1: First, let's see what we have in the database
-- Replace 'your-email@example.com' with your actual email address
DO $$
DECLARE
    user_record RECORD;
    family_record RECORD;
    kids_count INTEGER;
BEGIN
    -- Find the user
    SELECT id, email INTO user_record
    FROM auth.users 
    WHERE email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL
    
    IF user_record.id IS NULL THEN
        RAISE NOTICE 'User not found with that email';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: % (ID: %)', user_record.email, user_record.id;
    
    -- Check if user has a profile
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = user_record.id) THEN
        RAISE NOTICE 'Creating user profile...';
        INSERT INTO public.user_profiles (user_id, full_name, email)
        VALUES (user_record.id, split_part(user_record.email, '@', 1), user_record.email);
    END IF;
    
    -- Check if user has a family
    SELECT family_id INTO family_record
    FROM public.user_profiles 
    WHERE user_id = user_record.id;
    
    IF family_record.family_id IS NULL THEN
        RAISE NOTICE 'User has no family, creating one...';
        
        -- Create a family
        INSERT INTO public.families (name, created_by)
        VALUES (split_part(user_record.email, '@', 1) || '''s Family', user_record.id)
        RETURNING id INTO family_record.family_id;
        
        -- Update user profile with family_id
        UPDATE public.user_profiles 
        SET family_id = family_record.family_id 
        WHERE user_id = user_record.id;
        
        RAISE NOTICE 'Created family with ID: %', family_record.family_id;
    ELSE
        RAISE NOTICE 'User already has family ID: %', family_record.family_id;
    END IF;
    
    -- Check for existing kids
    SELECT COUNT(*) INTO kids_count
    FROM public.kids_profiles 
    WHERE family_id = family_record.family_id OR parent_user_id = user_record.id;
    
    RAISE NOTICE 'Found % kids profiles for this user', kids_count;
    
    -- If no kids found, let's create a sample one for testing
    IF kids_count = 0 THEN
        RAISE NOTICE 'No kids found. You can add kids through the UI or run the sample insert below.';
        RAISE NOTICE 'Sample insert: INSERT INTO public.kids_profiles (family_id, parent_user_id, name, birth_date) VALUES (''%'', ''%'', ''Sample Child'', ''2015-01-01'');', family_record.family_id, user_record.id;
    ELSE
        -- Show existing kids
        FOR family_record IN 
            SELECT name, birth_date, created_at 
            FROM public.kids_profiles 
            WHERE family_id = (SELECT family_id FROM public.user_profiles WHERE user_id = user_record.id)
               OR parent_user_id = user_record.id
        LOOP
            RAISE NOTICE 'Existing kid: % (born: %, created: %)', family_record.name, family_record.birth_date, family_record.created_at;
        END LOOP;
    END IF;
    
END $$;

-- Step 2: Verify the setup
-- Replace 'your-email@example.com' with your actual email address
SELECT 
    'User Setup Verification' as check_type,
    au.email,
    au.id as user_id,
    up.family_id,
    f.name as family_name,
    COUNT(kp.id) as kids_count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.families f ON up.family_id = f.id
LEFT JOIN public.kids_profiles kp ON f.id = kp.family_id
WHERE au.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
GROUP BY au.email, au.id, up.family_id, f.name;

-- Step 3: Test the RLS policies
-- This will show if the policies are working correctly
-- Replace 'USER_ID_HERE' with the actual user ID from step 2
/*
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "USER_ID_HERE"}';

SELECT 'RLS Test - Kids Profiles' as test_type, COUNT(*) as visible_kids
FROM public.kids_profiles;

SELECT 'RLS Test - Families' as test_type, COUNT(*) as visible_families  
FROM public.families;

RESET ROLE;
*/

-- Step 4: If you want to add a sample kid for testing, uncomment and modify this:
/*
INSERT INTO public.kids_profiles (
    family_id, 
    parent_user_id, 
    name, 
    birth_date, 
    gender,
    grade_level
) VALUES (
    (SELECT family_id FROM public.user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')),
    (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
    'Test Child',
    '2015-06-15',
    'other',
    'Kindergarten'
);
*/

-- Step 5: Final verification query
SELECT 
    'Final Check' as status,
    au.email as user_email,
    up.family_id as has_family,
    f.name as family_name,
    kp.name as kid_name,
    kp.birth_date as kid_birth_date,
    kp.created_at as kid_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.families f ON up.family_id = f.id
LEFT JOIN public.kids_profiles kp ON f.id = kp.family_id
WHERE au.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
ORDER BY kp.created_at;