-- Add AI-related fields to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_style TEXT;

-- Create index for faster queries on AI-generated tracks
CREATE INDEX IF NOT EXISTS idx_tracks_ai_generated ON tracks(ai_generated) WHERE ai_generated = TRUE;

-- Add comment to document the fields
COMMENT ON COLUMN tracks.ai_generated IS 'Indicates if the track was generated using AI (Suno API)';
COMMENT ON COLUMN tracks.ai_prompt IS 'The prompt used to generate the track';
COMMENT ON COLUMN tracks.ai_style IS 'The style/genre specified for AI generation';
