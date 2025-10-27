-- Add social link columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS farcaster_url TEXT,
ADD COLUMN IF NOT EXISTS x_url TEXT,
ADD COLUMN IF NOT EXISTS zora_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
