-- Add columns for email invitations to family_members table
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Add new columns for email invitations
ALTER TABLE family_members 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_members_invite_token ON family_members(invite_token);
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);

-- Add comments for documentation
COMMENT ON COLUMN family_members.email IS 'Email address for pending invitations (before user_id is set)';
COMMENT ON COLUMN family_members.invite_token IS 'Unique token for email invitation links';
COMMENT ON COLUMN family_members.expires_at IS 'Expiration date for the invitation';

SELECT 'Invite columns added successfully' as status;
