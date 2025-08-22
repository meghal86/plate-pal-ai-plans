-- Fix the kids_profiles RLS policies to work with the correct column structure
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view kids in families they created or are members of" ON kids_profiles;
DROP POLICY IF EXISTS "Users can create kids in families they created or are members o" ON kids_profiles;
DROP POLICY IF EXISTS "Users can update kids in families they created or are members o" ON kids_profiles;

-- Create simpler, working policies based on the actual table structure
-- Allow users to view kids that they created or are in their family
CREATE POLICY "Users can view kids they created or in their family" 
ON kids_profiles 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to create kids in their family
CREATE POLICY "Users can create kids in their family" 
ON kids_profiles 
FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to update kids they created or in their family
CREATE POLICY "Users can update kids they created or in their family" 
ON kids_profiles 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to delete kids they created or in their family
CREATE POLICY "Users can delete kids they created or in their family" 
ON kids_profiles 
FOR DELETE 
USING (
  created_by = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);