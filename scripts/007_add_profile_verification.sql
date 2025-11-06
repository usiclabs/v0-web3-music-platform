-- Add verified column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on verified profiles
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified) WHERE verified = TRUE;

-- Add comment
COMMENT ON COLUMN profiles.verified IS 'Whether the profile has been verified by an admin';
