-- Fix RLS policies for kids_meal_plans table
-- This addresses the 403 Forbidden and RLS policy violation errors

-- First, check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_meal_plans') THEN
        RAISE NOTICE 'kids_meal_plans table does not exist - creating it';
        
        -- Create the table if it doesn't exist
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
        
        -- Create indexes
        CREATE INDEX idx_kids_meal_plans_kid_id ON public.kids_meal_plans(kid_id);
        CREATE INDEX idx_kids_meal_plans_created_by ON public.kids_meal_plans(created_by);
        CREATE INDEX idx_kids_meal_plans_is_active ON public.kids_meal_plans(is_active);
        CREATE INDEX idx_kids_meal_plans_created_at ON public.kids_meal_plans(created_at);
        
    ELSE
        RAISE NOTICE 'kids_meal_plans table already exists';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.kids_meal_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view meal plans for their kids" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can insert meal plans for their kids" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can update meal plans for their kids" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Users can delete meal plans for their kids" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Enable read access for users to their kids meal plans" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Enable insert access for users to create kids meal plans" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Enable update access for users to their kids meal plans" ON public.kids_meal_plans;
DROP POLICY IF EXISTS "Enable delete access for users to their kids meal plans" ON public.kids_meal_plans;

-- Create comprehensive RLS policies

-- 1. SELECT policy - Users can view meal plans they created
CREATE POLICY "Users can view their created meal plans" ON public.kids_meal_plans
    FOR SELECT 
    USING (auth.uid() = created_by);

-- 2. INSERT policy - Users can create meal plans
CREATE POLICY "Users can create meal plans" ON public.kids_meal_plans
    FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

-- 3. UPDATE policy - Users can update meal plans they created
CREATE POLICY "Users can update their created meal plans" ON public.kids_meal_plans
    FOR UPDATE 
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- 4. DELETE policy - Users can delete meal plans they created
CREATE POLICY "Users can delete their created meal plans" ON public.kids_meal_plans
    FOR DELETE 
    USING (auth.uid() = created_by);

-- Grant necessary permissions
GRANT ALL ON public.kids_meal_plans TO authenticated;
GRANT ALL ON public.kids_meal_plans TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_kids_meal_plans_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_kids_meal_plans_updated_at ON public.kids_meal_plans;
CREATE TRIGGER update_kids_meal_plans_updated_at
    BEFORE UPDATE ON public.kids_meal_plans
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_kids_meal_plans_updated_at();

-- Create a function to safely insert meal plans
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
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Insert the meal plan
    INSERT INTO public.kids_meal_plans (
        kid_id,
        title,
        description,
        duration,
        plan_data,
        preferences,
        is_active,
        created_by
    ) VALUES (
        p_kid_id,
        p_title,
        p_description,
        p_duration,
        p_plan_data,
        p_preferences,
        p_is_active,
        current_user_id
    ) RETURNING id INTO new_plan_id;
    
    RETURN new_plan_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.insert_kids_meal_plan(UUID, TEXT, TEXT, INTEGER, JSONB, JSONB, BOOLEAN) TO authenticated;

-- Create a function to safely get meal plans for a kid
CREATE OR REPLACE FUNCTION public.get_kids_meal_plans(p_kid_id UUID)
RETURNS TABLE (
    id UUID,
    kid_id UUID,
    title TEXT,
    description TEXT,
    duration INTEGER,
    plan_data JSONB,
    preferences JSONB,
    is_active BOOLEAN,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Return meal plans created by the current user for the specified kid
    RETURN QUERY
    SELECT kmp.*
    FROM public.kids_meal_plans kmp
    WHERE kmp.kid_id = p_kid_id 
    AND kmp.created_by = current_user_id
    ORDER BY kmp.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_kids_meal_plans(UUID) TO authenticated;

-- Test the setup with a sample insert (this should work now)
DO $$
DECLARE
    test_user_id UUID;
    test_plan_id UUID;
BEGIN
    -- Get a test user ID (first user in the system)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the insert function
        SELECT public.insert_kids_meal_plan(
            gen_random_uuid(), -- kid_id
            'Test Meal Plan',
            'Test Description',
            7,
            '{"test": true, "daily_plans": []}'::jsonb,
            '{"dietary_restrictions": [], "allergies": []}'::jsonb,
            false
        ) INTO test_plan_id;
        
        IF test_plan_id IS NOT NULL THEN
            RAISE NOTICE 'Test insert successful! Plan ID: %', test_plan_id;
            
            -- Clean up test data
            DELETE FROM public.kids_meal_plans WHERE id = test_plan_id;
            RAISE NOTICE 'Test data cleaned up';
        ELSE
            RAISE NOTICE 'Test insert failed - no plan ID returned';
        END IF;
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
END $$;

-- Verify the setup
SELECT 
    'Table exists' as check_type,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_meal_plans') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'RLS enabled' as check_type,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'kids_meal_plans') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'Policies exist' as check_type,
    CASE WHEN EXISTS (SELECT FROM pg_policies WHERE tablename = 'kids_meal_plans') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'Permissions granted' as check_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.role_table_grants 
        WHERE table_name = 'kids_meal_plans' AND grantee = 'authenticated'
    ) THEN 'PASS' ELSE 'FAIL' END as status;

-- Show current policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'kids_meal_plans'
ORDER BY policyname;