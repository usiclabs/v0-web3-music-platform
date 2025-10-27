-- Make audio_url nullable to support video-only content
ALTER TABLE tracks
ALTER COLUMN audio_url DROP NOT NULL;

-- Add constraint to ensure either audio_url or video_url is present
ALTER TABLE tracks
ADD CONSTRAINT tracks_content_url_check 
CHECK (
  (content_type = 'audio' AND audio_url IS NOT NULL) OR
  (content_type = 'video' AND video_url IS NOT NULL)
);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT tracks_content_url_check ON tracks IS 'Ensures audio tracks have audio_url and video tracks have video_url';
