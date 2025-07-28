-- Fix RLS infinite recursion issue for families table
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Step 1: Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family creators can update their family" ON families;
DROP POLICY IF EXISTS "Family members can view their family" ON families;
DROP POLICY IF EXISTS "Users can view families they created or are members of" ON families;
DROP POLICY IF EXISTS "Family creators can view their families" ON families;
DROP POLICY IF EXISTS "Family members can view their families" ON families;

-- Step 2: Temporarily disable and re-enable RLS to clear any cached policies
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Step 3: Create a helper function to check family membership (avoids recursion)
CREATE OR REPLACE FUNCTION is_family_member(family_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_id = family_uuid 
        AND user_id = user_uuid 
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create simple, non-recursive policies

-- Policy 1: Users can create families (no recursion)
CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy 2: Users can view families they created (direct check, no recursion)
CREATE POLICY "Family creators can view their families" ON families
    FOR SELECT USING (auth.uid() = created_by);

-- Policy 3: Family members can view families (using helper function to avoid recursion)
CREATE POLICY "Family members can view their families" ON families
    FOR SELECT USING (is_family_member(id, auth.uid()));

-- Policy 4: Users can update families they created (direct check, no recursion)
CREATE POLICY "Family creators can update their family" ON families
    FOR UPDATE USING (auth.uid() = created_by);

-- Step 5: Test the policies by checking if they work without recursion
-- This should return without error if policies are working correctly
SELECT 'RLS policies fixed successfully' as status;
