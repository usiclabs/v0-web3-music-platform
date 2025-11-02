-- Add profile_token_address column to profiles table
-- This stores the deployed token contract address for profile tokenization

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_token_address text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_token_address IS 'Contract address of the user''s profile token (one-time deployment via Clanker)';
