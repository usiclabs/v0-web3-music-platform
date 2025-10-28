-- Create live_streams table for managing live streaming sessions
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  stream_key TEXT NOT NULL,
  playback_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_live BOOLEAN DEFAULT false,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view live streams
CREATE POLICY "Anyone can view live streams"
  ON live_streams
  FOR SELECT
  USING (true);

-- Policy: Artists can create their own live streams
CREATE POLICY "Artists can create their own live streams"
  ON live_streams
  FOR INSERT
  WITH CHECK (LOWER(artist_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Policy: Artists can update their own live streams
CREATE POLICY "Artists can update their own live streams"
  ON live_streams
  FOR UPDATE
  USING (LOWER(artist_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Policy: Artists can delete their own live streams
CREATE POLICY "Artists can delete their own live streams"
  ON live_streams
  FOR DELETE
  USING (LOWER(artist_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_live_streams_artist ON live_streams(artist_address);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at DESC);
