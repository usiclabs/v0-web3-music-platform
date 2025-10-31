-- Add is_hidden field to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tracks_is_hidden ON tracks(is_hidden);
