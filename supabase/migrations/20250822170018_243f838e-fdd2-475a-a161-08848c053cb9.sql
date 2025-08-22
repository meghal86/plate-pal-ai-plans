-- Enable RLS on all tables that have policies but RLS disabled
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Fix search_path for database functions to be secure
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
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_kids_meal_plans(p_kid_id UUID)
RETURNS SETOF kids_meal_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM kids_meal_plans 
  WHERE kid_id = p_kid_id 
  ORDER BY created_at DESC;
END;
$$;