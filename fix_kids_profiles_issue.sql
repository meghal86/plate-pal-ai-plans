-- Fix Kids Profiles Issue - Ensure children are properly linked to users
-- This addresses the issue where kids zone is not showing children

-- 1. Check if kids_profiles table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_profiles') THEN
        RAISE NOTICE 'kids_profiles table does not exist - creating it';
    ELSE
        RAISE NOTICE 'kids_profiles table exists';
    END IF;
END $$;

-- 2. Create or recreate kids_profiles table with proper structure
CREATE TABLE IF NOT EXISTS public.kids_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    grade_level TEXT,
    school_name TEXT,
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    favorite_foods TEXT[] DEFAULT '{}',
    disliked_foods TEXT[] DEFAULT '{}',
    activity_level TEXT CHECK (activity_level IN ('low', 'moderate', 'high')) DEFAULT 'moderate',
    height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 200),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 200),
    medical_conditions TEXT[] DEFAULT '{}',
    notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kids_profiles_family_id ON public.kids_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_kids_profiles_parent_user_id ON public.kids_profiles(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_kids_profiles_created_at ON public.kids_profiles(created_at);

-- 4. Enable RLS
ALTER TABLE public.kids_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view kids in their family" ON public.kids_profiles;
DROP POLICY IF EXISTS "Users can insert kids in their family" ON public.kids_profiles;
DROP POLICY IF EXISTS "Users can update kids in their family" ON public.kids_profiles;
DROP POLICY IF EXISTS "Users can delete kids in their family" ON public.kids_profiles;

-- 6. Create comprehensive RLS policies
-- Policy for SELECT (read) - users can see kids in their family OR kids they created
CREATE POLICY "Users can view kids in their family" ON public.kids_profiles
    FOR SELECT 
    USING (
        auth.uid() = parent_user_id OR
        family_id IN (
            SELECT family_id FROM public.user_profiles 
            WHERE user_id = auth.uid() AND family_id IS NOT NULL
        )
    );

-- Policy for INSERT (create) - users can create kids for their family
CREATE POLICY "Users can insert kids in their family" ON public.kids_profiles
    FOR INSERT 
    WITH CHECK (
        auth.uid() = parent_user_id AND
        (family_id IS NULL OR family_id IN (
            SELECT family_id FROM public.user_profiles 
            WHERE user_id = auth.uid() AND family_id IS NOT NULL
        ))
    );

-- Policy for UPDATE (modify) - users can update kids they created or in their family
CREATE POLICY "Users can update kids in their family" ON public.kids_profiles
    FOR UPDATE 
    USING (
        auth.uid() = parent_user_id OR
        family_id IN (
            SELECT family_id FROM public.user_profiles 
            WHERE user_id = auth.uid() AND family_id IS NOT NULL
        )
    )
    WITH CHECK (
        auth.uid() = parent_user_id OR
        family_id IN (
            SELECT family_id FROM public.user_profiles 
            WHERE user_id = auth.uid() AND family_id IS NOT NULL
        )
    );

-- Policy for DELETE (remove) - users can delete kids they created
CREATE POLICY "Users can delete kids in their family" ON public.kids_profiles
    FOR DELETE 
    USING (auth.uid() = parent_user_id);

-- 7. Grant necessary permissions
GRANT ALL ON public.kids_profiles TO authenticated;
GRANT ALL ON public.kids_profiles TO service_role;

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_kids_profiles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 9. Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_kids_profiles_updated_at ON public.kids_profiles;
CREATE TRIGGER update_kids_profiles_updated_at
    BEFORE UPDATE ON public.kids_profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_kids_profiles_updated_at();

-- 10. Check if families table exists, create if needed
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on families table
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for families table
DROP POLICY IF EXISTS "Users can view their families" ON public.families;
DROP POLICY IF EXISTS "Users can create families" ON public.families;
DROP POLICY IF EXISTS "Users can update their families" ON public.families;

CREATE POLICY "Users can view their families" ON public.families
    FOR SELECT 
    USING (
        created_by = auth.uid() OR
        id IN (
            SELECT family_id FROM public.user_profiles 
            WHERE user_id = auth.uid() AND family_id IS NOT NULL
        )
    );

CREATE POLICY "Users can create families" ON public.families
    FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their families" ON public.families
    FOR UPDATE 
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Grant permissions on families table
GRANT ALL ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;

-- 11. Ensure user_profiles table has family_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'family_id'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_user_profiles_family_id ON public.user_profiles(family_id);
    END IF;
END $$;

-- 12. Create a function to get or create a family for a user
CREATE OR REPLACE FUNCTION public.get_or_create_user_family(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_family_id UUID;
    new_family_id UUID;
    user_name TEXT;
BEGIN
    -- Check if user already has a family
    SELECT family_id INTO existing_family_id
    FROM public.user_profiles
    WHERE user_profiles.user_id = get_or_create_user_family.user_id;
    
    IF existing_family_id IS NOT NULL THEN
        RETURN existing_family_id;
    END IF;
    
    -- Get user's name for family name
    SELECT full_name INTO user_name
    FROM public.user_profiles
    WHERE user_profiles.user_id = get_or_create_user_family.user_id;
    
    -- Create a new family
    INSERT INTO public.families (name, created_by)
    VALUES (COALESCE(user_name, 'My Family') || '''s Family', user_id)
    RETURNING id INTO new_family_id;
    
    -- Update user profile with family_id
    UPDATE public.user_profiles
    SET family_id = new_family_id
    WHERE user_profiles.user_id = get_or_create_user_family.user_id;
    
    RETURN new_family_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_or_create_user_family(UUID) TO authenticated;

-- 13. Create a function to safely add a kid profile
CREATE OR REPLACE FUNCTION public.add_kid_profile(
    kid_name TEXT,
    kid_birth_date DATE DEFAULT NULL,
    kid_gender TEXT DEFAULT NULL,
    kid_grade_level TEXT DEFAULT NULL,
    kid_school_name TEXT DEFAULT NULL,
    kid_dietary_restrictions TEXT[] DEFAULT '{}',
    kid_allergies TEXT[] DEFAULT '{}',
    kid_favorite_foods TEXT[] DEFAULT '{}',
    kid_disliked_foods TEXT[] DEFAULT '{}',
    kid_activity_level TEXT DEFAULT 'moderate',
    kid_height_cm INTEGER DEFAULT NULL,
    kid_weight_kg DECIMAL(5,2) DEFAULT NULL,
    kid_medical_conditions TEXT[] DEFAULT '{}',
    kid_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_family_id UUID;
    new_kid_id UUID;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get or create family for the user
    user_family_id := public.get_or_create_user_family(auth.uid());
    
    -- Insert the kid profile
    INSERT INTO public.kids_profiles (
        family_id,
        parent_user_id,
        name,
        birth_date,
        gender,
        grade_level,
        school_name,
        dietary_restrictions,
        allergies,
        favorite_foods,
        disliked_foods,
        activity_level,
        height_cm,
        weight_kg,
        medical_conditions,
        notes
    ) VALUES (
        user_family_id,
        auth.uid(),
        kid_name,
        kid_birth_date,
        kid_gender,
        kid_grade_level,
        kid_school_name,
        kid_dietary_restrictions,
        kid_allergies,
        kid_favorite_foods,
        kid_disliked_foods,
        kid_activity_level,
        kid_height_cm,
        kid_weight_kg,
        kid_medical_conditions,
        kid_notes
    ) RETURNING id INTO new_kid_id;
    
    RETURN new_kid_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.add_kid_profile(TEXT, DATE, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], TEXT, INTEGER, DECIMAL(5,2), TEXT[], TEXT) TO authenticated;

-- 14. Create a view for easier kid profile access with family info
CREATE OR REPLACE VIEW public.kids_profiles_with_family AS
SELECT 
    kp.*,
    f.name as family_name,
    f.created_by as family_created_by
FROM public.kids_profiles kp
LEFT JOIN public.families f ON kp.family_id = f.id;

-- Grant access to the view
GRANT SELECT ON public.kids_profiles_with_family TO authenticated;

-- 15. Migrate existing kids profiles to ensure they have proper relationships
-- This will help if there are existing kids that lost their family connections
DO $$
DECLARE
    kid_record RECORD;
    user_family_id UUID;
BEGIN
    -- Loop through kids profiles that don't have a family_id but have a parent_user_id
    FOR kid_record IN 
        SELECT * FROM public.kids_profiles 
        WHERE family_id IS NULL AND parent_user_id IS NOT NULL
    LOOP
        -- Get or create family for the parent user
        user_family_id := public.get_or_create_user_family(kid_record.parent_user_id);
        
        -- Update the kid profile with the family_id
        UPDATE public.kids_profiles 
        SET family_id = user_family_id 
        WHERE id = kid_record.id;
        
        RAISE NOTICE 'Updated kid profile % with family_id %', kid_record.name, user_family_id;
    END LOOP;
END $$;

-- 16. Verify the setup
SELECT 'Kids profiles setup completed successfully!' as status;

-- Show summary statistics
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