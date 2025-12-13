-- Create autonomous artist agents table
CREATE TABLE IF NOT EXISTS autonomous_artist_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address VARCHAR(42) NOT NULL UNIQUE,
  wallet_address VARCHAR(42) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  artist_bio TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  generation_interval_hours INTEGER DEFAULT 24,
  max_daily_generations INTEGER DEFAULT 3,
  music_styles TEXT[] DEFAULT '{"electronic","ambient"}',
  genres TEXT[] DEFAULT '{"electronic"}',
  generation_prompt_template TEXT DEFAULT 'Create an original {genre} track with {styles} vibes. Make it experimental and unique.',
  min_generation_duration INTEGER DEFAULT 20,
  max_generation_duration INTEGER DEFAULT 40,
  auto_list_on_platform BOOLEAN DEFAULT TRUE,
  total_generated_count INTEGER DEFAULT 0,
  total_spent_on_generation VARCHAR(255) DEFAULT '0',
  total_spent_on_listing VARCHAR(255) DEFAULT '0',
  last_generation_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create autonomous artist activity table
CREATE TABLE IF NOT EXISTS autonomous_artist_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES autonomous_artist_agents(id) ON DELETE CASCADE,
  track_id VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'generate', 'upload', 'error'
  spent VARCHAR(255) DEFAULT '0',
  transaction_hash VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_autonomous_artist_agents_owner_address ON autonomous_artist_agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_autonomous_artist_agents_is_active ON autonomous_artist_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_autonomous_artist_activity_agent_id ON autonomous_artist_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_artist_activity_created_at ON autonomous_artist_activity(created_at);
