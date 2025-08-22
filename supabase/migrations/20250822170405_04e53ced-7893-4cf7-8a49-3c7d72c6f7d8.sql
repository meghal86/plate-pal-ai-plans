-- Drop all existing kids_profiles policies and recreate them correctly
DROP POLICY IF EXISTS "Allow authenticated users to manage kids profiles" ON kids_profiles;
DROP POLICY IF EXISTS "Users can create kids in families they created or are members o" ON kids_profiles;
DROP POLICY IF EXISTS "Users can create kids in their family" ON kids_profiles;
DROP POLICY IF EXISTS "Users can delete kids in their family" ON kids_profiles;
DROP POLICY IF EXISTS "Users can update kids in families they created or are members o" ON kids_profiles;
DROP POLICY IF EXISTS "Users can update kids in their family" ON kids_profiles;
DROP POLICY IF EXISTS "Users can view kids in families they created or are members of" ON kids_profiles;
DROP POLICY IF EXISTS "Users can view kids they created or in their family" ON kids_profiles;

-- Create new simple and working policies
CREATE POLICY "Kids profiles - users can view their family kids" 
ON kids_profiles 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Kids profiles - users can create kids in their family" 
ON kids_profiles 
FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Kids profiles - users can update their family kids" 
ON kids_profiles 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Kids profiles - users can delete their family kids" 
ON kids_profiles 
FOR DELETE 
USING (
  created_by = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
  )
);