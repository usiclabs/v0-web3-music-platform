-- Create user presence table for tracking online users and what they're doing
CREATE TABLE IF NOT EXISTS user_presence (
  user_address TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'listening', 'streaming')),
  current_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  current_stream_id UUID REFERENCES live_streams(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated_at ON user_presence(updated_at DESC);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view presence (to see who's online)
CREATE POLICY "Anyone can view presence"
ON user_presence FOR SELECT
USING (true);

-- Users can insert/update their own presence
CREATE POLICY "Users can manage own presence"
ON user_presence FOR ALL
USING (auth.jwt() ->> 'sub' = user_address OR user_address = current_setting('request.jwt.claim.sub', true));
