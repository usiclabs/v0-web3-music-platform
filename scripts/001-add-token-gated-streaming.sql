-- Add token-gated streaming columns to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS token_gated_streaming BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS required_token_balance NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN tracks.token_gated_streaming IS 'Whether token holders can stream for free';
COMMENT ON COLUMN tracks.required_token_balance IS 'Minimum token balance required for free streaming';
