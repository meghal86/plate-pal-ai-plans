-- Fix RLS policies for families table to allow users to create their first family
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family creators can update their family" ON families;
DROP POLICY IF EXISTS "Family members can view their family" ON families;

-- Create new policies that allow users to create families
CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view families they created or are members of" ON families
    FOR SELECT USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = families.id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    );

CREATE POLICY "Family creators can update their family" ON families
    FOR UPDATE USING (auth.uid() = created_by);

-- Also fix the kids_profiles policies to allow creation when user is the family creator
DROP POLICY IF EXISTS "Family members can create kids in their family" ON kids_profiles;

CREATE POLICY "Family members can create kids in their family" ON kids_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM families f
            WHERE f.id = kids_profiles.family_id 
            AND f.created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_members.family_id = kids_profiles.family_id 
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'accepted'
        )
    ); 