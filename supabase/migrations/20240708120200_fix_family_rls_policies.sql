-- Fix RLS policies for families table to prevent infinite recursion
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family creators can update their family" ON families;
DROP POLICY IF EXISTS "Family members can view their family" ON families;
DROP POLICY IF EXISTS "Users can view families they created or are members of" ON families;

-- Disable RLS temporarily to clear any cached policies
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Users can create families (no recursion here)
CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy 2: Users can view families they created (direct check, no recursion)
CREATE POLICY "Family creators can view their families" ON families
    FOR SELECT USING (auth.uid() = created_by);

-- Policy 3: Users can update families they created (direct check, no recursion)
CREATE POLICY "Family creators can update their family" ON families
    FOR UPDATE USING (auth.uid() = created_by);

-- Create a function to check family membership to avoid recursion in policies
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

-- Now create a policy for family members to view families using the function
CREATE POLICY "Family members can view their families" ON families
    FOR SELECT USING (
        auth.uid() = created_by OR
        is_family_member(id, auth.uid())
    );

-- Also fix the kids_profiles policies to allow creation when user is the family creator
DROP POLICY IF EXISTS "Family members can create kids in their family" ON kids_profiles;

CREATE POLICY "Family members can create kids in their family" ON kids_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM families f
            WHERE f.id = kids_profiles.family_id
            AND f.created_by = auth.uid()
        ) OR
        is_family_member(kids_profiles.family_id, auth.uid())
    );