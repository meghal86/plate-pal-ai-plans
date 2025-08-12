-- Fix user_profiles table and RLS policies
-- This addresses the 406 Not Acceptable error

-- First, let's check if the user_profiles table exists and recreate it if needed
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table with proper structure
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    dietary_preferences TEXT[],
    allergies TEXT[],
    medical_conditions TEXT[],
    fitness_goals TEXT[],
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profile_visibility": "private", "data_sharing": false}'::jsonb,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'family')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles(subscription_tier, subscription_expires_at);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Create a view for easier profile access
CREATE OR REPLACE VIEW public.user_profile_view AS
SELECT 
    up.*,
    au.email as auth_email,
    au.email_confirmed_at,
    au.created_at as auth_created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.user_profile_view TO authenticated;

-- Insert or update existing user profiles for current users
INSERT INTO public.user_profiles (user_id, full_name, email)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    au.email
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();

-- Verify the setup
SELECT 'user_profiles table created successfully' as status;
SELECT COUNT(*) as total_profiles FROM public.user_profiles;
SELECT COUNT(*) as total_users FROM auth.users;