-- Fix 406 Not Acceptable Error for user_profiles table
-- This script addresses common causes of 406 errors in Supabase

-- 1. Drop and recreate the user_profiles table with correct structure
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. Create the table with proper structure and constraints
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
    
    -- Add unique constraint on user_id
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles(subscription_tier, subscription_expires_at);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);

-- 4. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create comprehensive RLS policies
-- Policy for SELECT (read)
CREATE POLICY "Enable read access for users to their own profile" ON public.user_profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy for INSERT (create)
CREATE POLICY "Enable insert access for users to create their own profile" ON public.user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modify)
CREATE POLICY "Enable update access for users to their own profile" ON public.user_profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (remove)
CREATE POLICY "Enable delete access for users to their own profile" ON public.user_profiles
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. Create function to handle profile creation on user signup
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
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 8. Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 9. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 10. Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Create profiles for existing users
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

-- 12. Create a function to safely get user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    activity_level TEXT,
    dietary_preferences TEXT[],
    allergies TEXT[],
    medical_conditions TEXT[],
    fitness_goals TEXT[],
    preferred_language TEXT,
    timezone TEXT,
    notification_preferences JSONB,
    privacy_settings JSONB,
    subscription_tier TEXT,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lookup_user_id UUID;
BEGIN
    -- Use provided user_id or current authenticated user
    lookup_user_id := COALESCE(target_user_id, auth.uid());
    
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check if user is trying to access their own profile or has admin rights
    IF lookup_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Return the profile
    RETURN QUERY
    SELECT up.*
    FROM public.user_profiles up
    WHERE up.user_id = lookup_user_id;
    
    -- If no profile found, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_profiles (user_id, full_name, email)
        SELECT 
            au.id,
            COALESCE(
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'name',
                split_part(au.email, '@', 1)
            ),
            au.email
        FROM auth.users au
        WHERE au.id = lookup_user_id;
        
        -- Return the newly created profile
        RETURN QUERY
        SELECT up.*
        FROM public.user_profiles up
        WHERE up.user_id = lookup_user_id;
    END IF;
END;
$$;

-- 13. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;

-- 14. Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Total profiles: %', (SELECT COUNT(*) FROM public.user_profiles);
    RAISE NOTICE 'Users without profiles: %', (
        SELECT COUNT(*) 
        FROM auth.users au 
        LEFT JOIN public.user_profiles up ON au.id = up.user_id 
        WHERE up.user_id IS NULL
    );
END $$;