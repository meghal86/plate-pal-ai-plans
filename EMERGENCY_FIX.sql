-- EMERGENCY FIX - Run this immediately to resolve 406 errors
-- This is a minimal fix to get things working quickly

-- 1. Create user_profiles table if missing
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create kids_meal_plans table if missing
CREATE TABLE IF NOT EXISTS public.kids_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 7,
    plan_data JSONB NOT NULL,
    preferences JSONB,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Temporarily disable RLS to allow operations
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_meal_plans DISABLE ROW LEVEL SECURITY;

-- 4. Grant full permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.kids_meal_plans TO authenticated;
GRANT ALL ON public.kids_meal_plans TO service_role;

-- 5. Create profile for the specific user having issues
INSERT INTO public.user_profiles (user_id, full_name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    email
FROM auth.users 
WHERE id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Create profiles for all users who don't have them
INSERT INTO public.user_profiles (user_id, full_name, email)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    au.email
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 7. Verify the fix
SELECT 'Emergency fix completed!' as status;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 8. Test the specific user
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM public.user_profiles WHERE user_id = '359ad3fd-70a1-481d-8360-bcc2dc61a55c')
        THEN '✅ Profile exists for user 359ad3fd-70a1-481d-8360-bcc2dc61a55c'
        ELSE '❌ Profile missing for user 359ad3fd-70a1-481d-8360-bcc2dc61a55c'
    END as profile_status;

-- NOTE: This emergency fix disables RLS for immediate functionality
-- After testing, run COMPLETE_DATABASE_FIX.sql for proper security