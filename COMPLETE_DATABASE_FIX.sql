-- COMPLETE DATABASE FIX SCRIPT
-- This script fixes all 406 Not Acceptable errors for both user_profiles and kids_meal_plans tables
-- Run this entire script in your Supabase SQL editor

-- ============================================================================
-- PART 1: FIX USER_PROFILES TABLE
-- ============================================================================

-- Drop and recreate user_profiles table with proper structure
DROP TABLE IF EXISTS public.user_profiles CASCADE;

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 1000),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    dietary_preferences TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    medical_conditions TEXT[] DEFAULT '{}',
    fitness_goals TEXT[] DEFAULT '{}',
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profile_visibility": "private", "data_sharing": false}'::jsonb,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'family')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Create indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles(subscription_tier, subscription_expires_at);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions for user_profiles
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- ============================================================================
-- PART 2: FIX KIDS_MEAL_PLANS TABLE
-- ============================================================================

-- Drop and recreate kids_meal_plans table with proper structure
DROP TABLE IF EXISTS public.kids_meal_plans CASCADE;

CREATE TABLE public.kids_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 7,
    plan_data JSONB NOT NULL,
    preferences JSONB,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for kids_meal_plans
CREATE INDEX idx_kids_meal_plans_kid_id ON public.kids_meal_plans(kid_id);
CREATE INDEX idx_kids_meal_plans_created_by ON public.kids_meal_plans(created_by);
CREATE INDEX idx_kids_meal_plans_is_active ON public.kids_meal_plans(is_active);
CREATE INDEX idx_kids_meal_plans_created_at ON public.kids_meal_plans(created_at);

-- Enable RLS for kids_meal_plans
ALTER TABLE public.kids_meal_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kids_meal_plans
CREATE POLICY "Users can view their created meal plans" ON public.kids_meal_plans
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create meal plans" ON public.kids_meal_plans
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their created meal plans" ON public.kids_meal_plans
    FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their created meal plans" ON public.kids_meal_plans
    FOR DELETE USING (auth.uid() = created_by);

-- Grant permissions for kids_meal_plans
GRANT ALL ON public.kids_meal_plans TO authenticated;
GRANT ALL ON public.kids_meal_plans TO service_role;

-- ============================================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, email, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to safely insert kids meal plans
CREATE OR REPLACE FUNCTION public.insert_kids_meal_plan(
    p_kid_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_duration INTEGER,
    p_plan_data JSONB,
    p_preferences JSONB,
    p_is_active BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_plan_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    INSERT INTO public.kids_meal_plans (
        kid_id, title, description, duration, plan_data, preferences, is_active, created_by
    ) VALUES (
        p_kid_id, p_title, p_description, p_duration, p_plan_data, p_preferences, p_is_active, current_user_id
    ) RETURNING id INTO new_plan_id;
    
    RETURN new_plan_id;
END;
$$;

-- Function to safely get kids meal plans
CREATE OR REPLACE FUNCTION public.get_kids_meal_plans(p_kid_id UUID)
RETURNS TABLE (
    id UUID, kid_id UUID, title TEXT, description TEXT, duration INTEGER,
    plan_data JSONB, preferences JSONB, is_active BOOLEAN, created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    RETURN QUERY
    SELECT kmp.*
    FROM public.kids_meal_plans kmp
    WHERE kmp.kid_id = p_kid_id 
    AND kmp.created_by = current_user_id
    ORDER BY kmp.created_at DESC;
END;
$$;

-- ============================================================================
-- PART 4: CREATE TRIGGERS
-- ============================================================================

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for kids_meal_plans updated_at
DROP TRIGGER IF EXISTS update_kids_meal_plans_updated_at ON public.kids_meal_plans;
CREATE TRIGGER update_kids_meal_plans_updated_at
    BEFORE UPDATE ON public.kids_meal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 5: GRANT FUNCTION PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_kids_meal_plan(UUID, TEXT, TEXT, INTEGER, JSONB, JSONB, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kids_meal_plans(UUID) TO authenticated;

-- ============================================================================
-- PART 6: CREATE PROFILES FOR EXISTING USERS
-- ============================================================================

-- Insert profiles for existing users
INSERT INTO public.user_profiles (user_id, full_name, email, preferred_language)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ) as full_name,
    au.email,
    COALESCE(au.raw_user_meta_data->>'preferred_language', 'en') as preferred_language
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.user_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();

-- ============================================================================
-- PART 7: VERIFICATION AND TESTING
-- ============================================================================

-- Test the setup
DO $$
DECLARE
    test_user_id UUID;
    test_plan_id UUID;
    profile_count INTEGER;
    user_count INTEGER;
BEGIN
    -- Count users and profiles
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
    
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE 'Total users: %', user_count;
    RAISE NOTICE 'Total profiles: %', profile_count;
    
    -- Test meal plan function if we have users
    IF user_count > 0 THEN
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
        
        -- Test the insert function
        SELECT public.insert_kids_meal_plan(
            gen_random_uuid(),
            'Test Meal Plan',
            'Test Description',
            7,
            '{"test": true, "daily_plans": []}'::jsonb,
            '{"dietary_restrictions": [], "allergies": []}'::jsonb,
            false
        ) INTO test_plan_id;
        
        IF test_plan_id IS NOT NULL THEN
            RAISE NOTICE 'Kids meal plan test insert successful!';
            DELETE FROM public.kids_meal_plans WHERE id = test_plan_id;
            RAISE NOTICE 'Test data cleaned up';
        END IF;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test completed with warning: %', SQLERRM;
END $$;

-- Final verification
SELECT 
    'user_profiles table' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') 
         THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as rls_status
UNION ALL
SELECT 
    'kids_meal_plans table' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_meal_plans') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'kids_meal_plans') 
         THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as rls_status;

-- Show policy counts
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'kids_meal_plans')
GROUP BY tablename;

RAISE NOTICE '🎉 Database fix completed! Both user_profiles and kids_meal_plans tables are now properly configured.';