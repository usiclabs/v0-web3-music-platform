-- Create autonomous_artist_agents table
CREATE TABLE IF NOT EXISTS autonomous_artist_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuration
  artist_style TEXT DEFAULT 'ambient',
  preferred_genres TEXT[] DEFAULT ARRAY['electronic', 'synthwave'],
  album_art_style TEXT DEFAULT 'abstract',
  generation_frequency_hours INTEGER DEFAULT 24,
  auto_list_on_platform BOOLEAN DEFAULT true,
  
  -- Budget
  daily_budget_usdc NUMERIC DEFAULT 50,
  generation_cost_usdc NUMERIC DEFAULT 1,
  listing_cost_usdc NUMERIC DEFAULT 0,
  daily_spent_usdc NUMERIC DEFAULT 0,
  total_spent_usdc NUMERIC DEFAULT 0,
  
  -- Stats
  total_songs_generated INTEGER DEFAULT 0,
  total_songs_listed INTEGER DEFAULT 0,
  total_songs_earning INTEGER DEFAULT 0,
  total_earnings_usdc NUMERIC DEFAULT 0,
  
  -- Timing
  last_generation_at TIMESTAMP WITH TIME ZONE,
  next_generation_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create autonomous_artist_activity table
CREATE TABLE IF NOT EXISTS autonomous_artist_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES autonomous_artist_agents(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'generation', 'listing', 'earning', 'error'
  track_id UUID,
  song_title TEXT,
  
  -- Generation details
  generation_prompt TEXT,
  generation_style TEXT,
  suno_track_id TEXT,
  audio_url TEXT,
  
  -- Listing details
  listed_at TIMESTAMP WITH TIME ZONE,
  listing_tx_hash TEXT,
  
  -- Payment details
  cost_usdc NUMERIC,
  tx_hash TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'success', 'pending', 'failed'
  error_message TEXT,
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create autonomous_artist_wallets table
CREATE TABLE IF NOT EXISTS autonomous_artist_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES autonomous_artist_agents(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  private_key_encrypted TEXT NOT NULL,
  
  -- Balances
  usdc_balance NUMERIC DEFAULT 0,
  eth_balance NUMERIC DEFAULT 0,
  
  -- Stats
  total_paid_usdc NUMERIC DEFAULT 0,
  total_generated INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE autonomous_artist_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_artist_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_artist_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for autonomous_artist_agents
CREATE POLICY "Users can view own autonomous artist agents"
  ON autonomous_artist_agents
  FOR SELECT
  USING (auth.jwt() ->> 'custom_user_address' = owner_address OR owner_address IS NULL);

CREATE POLICY "Users can create autonomous artist agents"
  ON autonomous_artist_agents
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'custom_user_address' = owner_address);

CREATE POLICY "Users can update own autonomous artist agents"
  ON autonomous_artist_agents
  FOR UPDATE
  USING (auth.jwt() ->> 'custom_user_address' = owner_address);

CREATE POLICY "Users can delete own autonomous artist agents"
  ON autonomous_artist_agents
  FOR DELETE
  USING (auth.jwt() ->> 'custom_user_address' = owner_address);

-- RLS Policies for autonomous_artist_activity
CREATE POLICY "Users can view own agent activity"
  ON autonomous_artist_activity
  FOR SELECT
  USING (agent_id IN (SELECT id FROM autonomous_artist_agents WHERE owner_address = auth.jwt() ->> 'custom_user_address'));

CREATE POLICY "Service can log activity"
  ON autonomous_artist_activity
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for autonomous_artist_wallets
CREATE POLICY "Service has full access to wallets"
  ON autonomous_artist_wallets
  FOR ALL
  USING (true);

CREATE POLICY "Users can view own agent wallets"
  ON autonomous_artist_wallets
  FOR SELECT
  USING (agent_id IN (SELECT id FROM autonomous_artist_agents WHERE owner_address = auth.jwt() ->> 'custom_user_address'));

-- Indexes for performance
CREATE INDEX idx_autonomous_artist_agents_owner ON autonomous_artist_agents(owner_address);
CREATE INDEX idx_autonomous_artist_agents_active ON autonomous_artist_agents(is_active, next_generation_at);
CREATE INDEX idx_autonomous_artist_activity_agent ON autonomous_artist_activity(agent_id, created_at DESC);
CREATE INDEX idx_autonomous_artist_wallets_agent ON autonomous_artist_wallets(agent_id);
CREATE INDEX idx_autonomous_artist_wallets_address ON autonomous_artist_wallets(wallet_address);
