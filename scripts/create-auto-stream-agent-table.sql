-- Create auto_stream_agents table for managing auto-streaming agents
CREATE TABLE IF NOT EXISTS auto_stream_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  stream_interval_minutes INTEGER DEFAULT 15, -- How often to stream a track
  max_daily_streams INTEGER DEFAULT 100, -- Maximum streams per day
  target_genres TEXT[] DEFAULT ARRAY[]::TEXT[], -- Filter tracks by genre
  min_track_duration INTEGER DEFAULT 30, -- Minimum track duration in seconds
  max_track_duration INTEGER DEFAULT 600, -- Maximum track duration in seconds
  play_full_tracks BOOLEAN DEFAULT TRUE, -- Whether to play full tracks or just chunks
  randomize_timing BOOLEAN DEFAULT TRUE, -- Add random delays to appear more natural
  last_stream_at TIMESTAMP WITH TIME ZONE,
  total_streams_count INTEGER DEFAULT 0,
  total_amount_paid NUMERIC(20, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_address)
);

-- Create auto_stream_activity table for logging agent activity
CREATE TABLE IF NOT EXISTS auto_stream_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auto_stream_agents(id) ON DELETE CASCADE,
  track_id UUID NOT NULL,
  chunks_played INTEGER DEFAULT 0,
  amount_paid NUMERIC(20, 6) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE auto_stream_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_stream_activity ENABLE ROW LEVEL SECURITY;

-- Policies for auto_stream_agents
CREATE POLICY "Users can view their own agents"
  ON auto_stream_agents FOR SELECT
  USING (auth.uid()::text = owner_address OR owner_address IN (
    SELECT address FROM user_wallets WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own agents"
  ON auto_stream_agents FOR INSERT
  WITH CHECK (auth.uid()::text = owner_address OR owner_address IN (
    SELECT address FROM user_wallets WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own agents"
  ON auto_stream_agents FOR UPDATE
  USING (auth.uid()::text = owner_address OR owner_address IN (
    SELECT address FROM user_wallets WHERE user_id = auth.uid()
  ));

-- Policies for auto_stream_activity
CREATE POLICY "Users can view their agent activity"
  ON auto_stream_activity FOR SELECT
  USING (agent_id IN (
    SELECT id FROM auto_stream_agents 
    WHERE owner_address = auth.uid()::text 
    OR owner_address IN (
      SELECT address FROM user_wallets WHERE user_id = auth.uid()
    )
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auto_stream_agents_owner ON auto_stream_agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_auto_stream_agents_active ON auto_stream_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_stream_activity_agent ON auto_stream_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_auto_stream_activity_created ON auto_stream_activity(created_at DESC);
