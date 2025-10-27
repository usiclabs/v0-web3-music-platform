-- Add social link columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS farcaster_url TEXT,
ADD COLUMN IF NOT EXISTS x_url TEXT,
ADD COLUMN IF NOT EXISTS zora_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN profiles.farcaster_url IS 'Artist Farcaster/Warpcast profile URL';
COMMENT ON COLUMN profiles.x_url IS 'Artist X (Twitter) profile URL';
COMMENT ON COLUMN profiles.zora_url IS 'Artist Zora profile URL';
COMMENT ON COLUMN profiles.tiktok_url IS 'Artist TikTok profile URL';
