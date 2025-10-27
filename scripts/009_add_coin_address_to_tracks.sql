-- Add coin_address field to tracks table for Zora coin integration
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS coin_address TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracks_coin_address ON tracks(coin_address);

-- Add comment
COMMENT ON COLUMN tracks.coin_address IS 'Zora coin contract address if track is tokenized';
