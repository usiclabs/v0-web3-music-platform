-- Add livepeer_stream_id column to live_streams table
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS livepeer_stream_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_live_streams_livepeer_stream_id ON live_streams(livepeer_stream_id);
