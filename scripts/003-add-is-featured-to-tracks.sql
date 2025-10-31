-- Add is_featured field to tracks table for admin-curated featured content
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on featured tracks
CREATE INDEX IF NOT EXISTS idx_tracks_is_featured ON tracks(is_featured) WHERE is_featured = TRUE;

-- Add comment
COMMENT ON COLUMN tracks.is_featured IS 'Indicates if track is featured on discover page';
