-- Fix RLS policies for family_members table to allow invitations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert family members" ON family_members;
DROP POLICY IF EXISTS "Users can update family members" ON family_members;

-- Allow users to view family members in their families
CREATE POLICY "Users can view family members" ON family_members
    FOR SELECT USING (
        -- User is the family creator
        EXISTS (
            SELECT 1 FROM families 
            WHERE families.id = family_members.family_id 
            AND families.created_by = auth.uid()
        ) OR
        -- User is a member of the family
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = family_members.family_id 
            AND fm.user_id = auth.uid()
            AND fm.status = 'accepted'
        ) OR
        -- User is viewing their own record
        family_members.user_id = auth.uid()
    );

-- Allow users to insert family members (send invitations)
CREATE POLICY "Users can insert family members" ON family_members
    FOR INSERT WITH CHECK (
        -- User is the family creator
        EXISTS (
            SELECT 1 FROM families 
            WHERE families.id = family_members.family_id 
            AND families.created_by = auth.uid()
        ) OR
        -- User is an accepted member of the family
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = family_members.family_id 
            AND fm.user_id = auth.uid()
            AND fm.status = 'accepted'
        )
    );

-- Allow users to update family member records
CREATE POLICY "Users can update family members" ON family_members
    FOR UPDATE USING (
        -- User is updating their own record (accepting invitation)
        family_members.user_id = auth.uid() OR
        -- User is the family creator
        EXISTS (
            SELECT 1 FROM families 
            WHERE families.id = family_members.family_id 
            AND families.created_by = auth.uid()
        )
    );