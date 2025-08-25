-- Fix infinite recursion in family_members RLS policies
-- The issue is that policies are trying to join tables while checking policies

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert family members" ON family_members;
DROP POLICY IF EXISTS "Users can create family members" ON family_members;

-- Create a security definer function to check family membership
CREATE OR REPLACE FUNCTION public.is_family_member(p_family_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user is the family creator
  IF EXISTS (
    SELECT 1 FROM families 
    WHERE id = p_family_id AND created_by = p_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is an accepted family member
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = p_family_id 
    AND user_id = p_user_id 
    AND status = 'accepted'
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_family_member(uuid, uuid) TO authenticated;

-- Create simpler RLS policies using the function
CREATE POLICY "Users can view family members" ON family_members
FOR SELECT USING (
  public.is_family_member(family_id, auth.uid()) OR 
  user_id = auth.uid()
);

CREATE POLICY "Users can insert family members" ON family_members  
FOR INSERT WITH CHECK (
  public.is_family_member(family_id, auth.uid())
);

-- Also fix the kids_meal_plans policies that have similar issues
DROP POLICY IF EXISTS "Users can access meal plans for their family kids" ON kids_meal_plans;

-- Create a function to check if user can access kid's meal plans  
CREATE OR REPLACE FUNCTION public.can_access_kid_meal_plans(p_kid_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  kid_family_id uuid;
BEGIN
  -- Get the kid's family_id
  SELECT family_id INTO kid_family_id 
  FROM kids_profiles 
  WHERE id = p_kid_id;
  
  IF kid_family_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user can access this family
  RETURN public.is_family_member(kid_family_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_access_kid_meal_plans(uuid, uuid) TO authenticated;

-- Create new policy for kids_meal_plans
CREATE POLICY "Users can access meal plans for family kids" ON kids_meal_plans
FOR ALL USING (
  created_by = auth.uid() OR 
  public.can_access_kid_meal_plans(kid_id, auth.uid())
);