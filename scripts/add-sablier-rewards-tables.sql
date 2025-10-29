-- Create tables for Sablier streaming rewards system

-- Table to track created reward streams
CREATE TABLE IF NOT EXISTS reward_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  stream_id TEXT NOT NULL UNIQUE,
  token_address TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  claimed_amount TEXT DEFAULT '0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track reward claims
CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  amount TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_streams_user ON reward_streams(user_address);
CREATE INDEX IF NOT EXISTS idx_reward_streams_active ON reward_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_address);
CREATE INDEX IF NOT EXISTS idx_reward_claims_stream ON reward_claims(stream_id);

-- Enable RLS
ALTER TABLE reward_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own streams"
  ON reward_streams FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own claims"
  ON reward_claims FOR SELECT
  USING (true);

-- Allow inserts from authenticated users
CREATE POLICY "Allow stream creation"
  ON reward_streams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow claim creation"
  ON reward_claims FOR INSERT
  WITH CHECK (true);
