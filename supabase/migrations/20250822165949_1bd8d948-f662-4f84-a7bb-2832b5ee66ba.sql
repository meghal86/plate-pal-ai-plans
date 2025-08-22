-- Create the missing insert_kids_meal_plan function
CREATE OR REPLACE FUNCTION public.insert_kids_meal_plan(
  p_kid_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_duration INTEGER,
  p_plan_data JSONB,
  p_preferences JSONB,
  p_is_active BOOLEAN DEFAULT FALSE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_plan_id UUID;
BEGIN
  -- Insert the meal plan
  INSERT INTO kids_meal_plans (
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
    auth.uid()
  ) RETURNING id INTO new_plan_id;
  
  RETURN new_plan_id;
END;
$$;

-- Create the missing get_kids_meal_plans function
CREATE OR REPLACE FUNCTION public.get_kids_meal_plans(p_kid_id UUID)
RETURNS SETOF kids_meal_plans
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM kids_meal_plans 
  WHERE kid_id = p_kid_id 
  ORDER BY created_at DESC;
END;
$$;

-- Update RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can insert kids meal plans for their family kids" ON kids_meal_plans;
DROP POLICY IF EXISTS "Users can view kids meal plans they have access to" ON kids_meal_plans;

-- Create simpler, more permissive policies
CREATE POLICY "Users can insert their own kids meal plans" 
ON kids_meal_plans 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view kids meal plans they created" 
ON kids_meal_plans 
FOR SELECT 
USING (auth.uid() = created_by);

-- Grant execute permissions on the functions to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_kids_meal_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kids_meal_plans TO authenticated;