-- Fix RLS policies for kids_profiles to allow family creators to create kids
-- Drop existing policies
DROP POLICY IF EXISTS "Family members can create kids in their family" ON kids_profiles;
DROP POLICY IF EXISTS "Family members can view kids in their family" ON kids_profiles;
DROP POLICY IF EXISTS "Family members can update kids in their family" ON kids_profiles;

-- Create new, more permissive policies
CREATE POLICY "Users can create kids in families they created or are members of" ON kids_profiles
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

CREATE POLICY "Users can view kids in families they created or are members of" ON kids_profiles
    FOR SELECT USING (
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

CREATE POLICY "Users can update kids in families they created or are members of" ON kids_profiles
    FOR UPDATE USING (
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