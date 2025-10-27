-- Add video support to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'audio' CHECK (content_type IN ('audio', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create index for content type filtering
CREATE INDEX IF NOT EXISTS idx_tracks_content_type ON tracks(content_type);

-- Update existing tracks to have content_type = 'audio'
UPDATE tracks SET content_type = 'audio' WHERE content_type IS NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN tracks.content_type IS 'Type of content: audio or video';
COMMENT ON COLUMN tracks.video_url IS 'URL to video file in Supabase Storage (for video content)';
COMMENT ON COLUMN tracks.thumbnail_url IS 'URL to video thumbnail image (for video content)';
