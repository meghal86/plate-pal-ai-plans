-- Fix infinite recursion in families table RLS policies
-- This happens when policies reference each other in a circular manner

-- First, drop all existing policies on families table
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Users can view families they created or are members of" ON families;
DROP POLICY IF EXISTS "Family creators can update their family" ON families;
DROP POLICY IF EXISTS "Family members can view their family" ON families;

-- Create simpler policies that don't cause recursion
-- Policy 1: Users can create families
CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy 2: Users can view families they created (simple, no recursion)
CREATE POLICY "Users can view families they created" ON families
    FOR SELECT USING (auth.uid() = created_by);

-- Policy 3: Users can update families they created
CREATE POLICY "Family creators can update their family" ON families
    FOR UPDATE USING (auth.uid() = created_by);

-- Note: We're removing the policy that checks family_members table to avoid recursion
-- Family membership access will be handled at the application level or through
-- a different approach that doesn't create circular dependencies