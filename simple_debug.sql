-- Simple debug script for kids_meal_plans table

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'kids_meal_plans'
) as table_exists;

-- 2. If table exists, check basic structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kids_meal_plans'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check current user
SELECT auth.uid() as current_user_id;

-- 4. Count total records (this will fail if RLS is blocking)
SELECT COUNT(*) as total_records FROM kids_meal_plans;

-- 5. Try to select with no filters (this will show RLS issues)
SELECT id, title, kid_id, created_by, is_active 
FROM kids_meal_plans 
LIMIT 5;