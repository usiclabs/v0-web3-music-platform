-- Add unlock_type column to tracks table
ALTER TABLE tracks
ADD COLUMN unlock_type TEXT DEFAULT 'per_chunk' CHECK (unlock_type IN ('per_chunk', 'full_song'));

-- Update existing tracks to use per_chunk (default behavior)
UPDATE tracks SET unlock_type = 'per_chunk' WHERE unlock_type IS NULL;
