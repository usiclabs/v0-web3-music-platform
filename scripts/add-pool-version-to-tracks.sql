-- Add pool_version column to tracks table to track Uniswap v3 vs v4 pools
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS pool_version TEXT DEFAULT 'v3';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tracks_pool_version ON tracks(pool_version);

-- Add comment
COMMENT ON COLUMN tracks.pool_version IS 'Uniswap pool version: v3 or v4';
