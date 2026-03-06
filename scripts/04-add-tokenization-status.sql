-- Add is_tokenized column to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_tokenized boolean DEFAULT false;

-- Create index for faster queries on tokenized tracks
CREATE INDEX IF NOT EXISTS idx_tracks_is_tokenized ON tracks(is_tokenized) WHERE is_tokenized = true;

-- Update existing tracks that have a coin_address to be marked as tokenized
UPDATE tracks SET is_tokenized = true WHERE coin_address IS NOT NULL;
