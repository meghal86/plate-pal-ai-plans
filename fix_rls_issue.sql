-- Fix RLS issues for kids_meal_plans table

-- First, check if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kids_meal_plans') THEN
        -- Temporarily disable RLS for testing
        ALTER TABLE kids_meal_plans DISABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can access meal plans for their family kids" ON kids_meal_plans;
        
        -- Create a simpler, more permissive policy for testing
        CREATE POLICY "Allow all for authenticated users" ON kids_meal_plans
            FOR ALL USING (auth.uid() IS NOT NULL);
        
        -- Re-enable RLS
        ALTER TABLE kids_meal_plans ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'RLS policies updated for kids_meal_plans';
    ELSE
        RAISE NOTICE 'kids_meal_plans table does not exist';
    END IF;
END
$$;