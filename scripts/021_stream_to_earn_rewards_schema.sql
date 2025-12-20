-- Stream-to-Earn Rewards System Schema
-- Tracks USI rewards earned by listeners when they unlock songs via X402

-- Admin rewards wallet configuration
CREATE TABLE IF NOT EXISTS stream_to_earn_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_address TEXT NOT NULL,
  rewards_wallet_address TEXT NOT NULL,
  rewards_wallet_private_key_encrypted TEXT,
  usi_token_address TEXT NOT NULL,
  reward_amount_per_unlock NUMERIC NOT NULL DEFAULT 10, -- USI tokens per song unlock
  eth_gas_reserve_balance NUMERIC NOT NULL DEFAULT 0, -- ETH balance reserved for gas
  usi_balance NUMERIC NOT NULL DEFAULT 0, -- Current USI balance
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_distribute_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  min_balance_threshold NUMERIC NOT NULL DEFAULT 100, -- Minimum USI to maintain
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(admin_address),
  CONSTRAINT positive_reward_amount CHECK (reward_amount_per_unlock > 0)
);

-- Track all reward distributions
CREATE TABLE IF NOT EXISTS stream_to_earn_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  track_id UUID NOT NULL,
  unlock_type TEXT NOT NULL, -- 'x402_chunk_unlock' or 'full_song_unlock'
  chunk_index INTEGER, -- NULL if full song unlock
  reward_amount_usi NUMERIC NOT NULL,
  settlement_tx_hash TEXT NOT NULL UNIQUE, -- Reference to X402 settlement transaction
  reward_tx_hash TEXT, -- Transaction hash when reward was sent to user
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'distributing', 'completed', 'failed'
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'distributing', 'completed', 'failed')),
  CONSTRAINT valid_unlock_type CHECK (unlock_type IN ('x402_chunk_unlock', 'full_song_unlock'))
);

-- Fixed index syntax - moved out of CREATE TABLE
CREATE INDEX IF NOT EXISTS idx_stream_rewards_user_address ON stream_to_earn_rewards(user_address);
CREATE INDEX IF NOT EXISTS idx_stream_rewards_status ON stream_to_earn_rewards(status);
CREATE INDEX IF NOT EXISTS idx_stream_rewards_created_at ON stream_to_earn_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_rewards_settlement_tx ON stream_to_earn_rewards(settlement_tx_hash);

-- Admin activity log
CREATE TABLE IF NOT EXISTS stream_to_earn_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_address TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'wallet_funded', 'reward_distributed', 'config_updated', 'withdrawal'
  description TEXT,
  metadata JSONB, -- Additional context
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Fixed index syntax - moved out of CREATE TABLE
CREATE INDEX IF NOT EXISTS idx_stream_activity_admin ON stream_to_earn_activity(admin_address);
CREATE INDEX IF NOT EXISTS idx_stream_activity_type ON stream_to_earn_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_stream_activity_created_at ON stream_to_earn_activity(created_at DESC);

-- Nightly batch processing queue for pending rewards
CREATE TABLE IF NOT EXISTS stream_to_earn_batch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number INTEGER NOT NULL UNIQUE,
  total_rewards_count INTEGER NOT NULL,
  total_amount_usi NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  tx_hash TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_batch_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Fixed index syntax - moved out of CREATE TABLE
CREATE INDEX IF NOT EXISTS idx_stream_batch_status ON stream_to_earn_batch_queue(status);
CREATE INDEX IF NOT EXISTS idx_stream_batch_created_at ON stream_to_earn_batch_queue(created_at DESC);

-- RLS Policies
ALTER TABLE stream_to_earn_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_to_earn_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_to_earn_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_to_earn_batch_queue ENABLE ROW LEVEL SECURITY;

-- Config policies (only admin can manage)
CREATE POLICY "Only admin can view config" ON stream_to_earn_config
  FOR SELECT USING (auth.uid()::text = admin_address);

CREATE POLICY "Only admin can update config" ON stream_to_earn_config
  FOR UPDATE USING (auth.uid()::text = admin_address);

CREATE POLICY "Service role can manage config" ON stream_to_earn_config
  FOR ALL USING (auth.role() = 'service_role');

-- Rewards policies
CREATE POLICY "Users can view own rewards" ON stream_to_earn_rewards
  FOR SELECT USING (auth.uid()::text = user_address OR auth.role() = 'service_role');

CREATE POLICY "Service can insert rewards" ON stream_to_earn_rewards
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service can update rewards" ON stream_to_earn_rewards
  FOR UPDATE USING (auth.role() = 'service_role');

-- Activity policies
CREATE POLICY "Only admin can view activity" ON stream_to_earn_activity
  FOR SELECT USING (auth.uid()::text = admin_address OR auth.role() = 'service_role');

CREATE POLICY "Service can log activity" ON stream_to_earn_activity
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Batch queue policies
CREATE POLICY "Service can manage batch queue" ON stream_to_earn_batch_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for managing stream_to_earn_config updated_at
CREATE OR REPLACE FUNCTION update_stream_to_earn_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stream_to_earn_config_updated_at
BEFORE UPDATE ON stream_to_earn_config
FOR EACH ROW
EXECUTE FUNCTION update_stream_to_earn_config_updated_at();

-- Function for managing stream_to_earn_rewards updated_at
CREATE OR REPLACE FUNCTION update_stream_to_earn_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stream_to_earn_rewards_updated_at
BEFORE UPDATE ON stream_to_earn_rewards
FOR EACH ROW
EXECUTE FUNCTION update_stream_to_earn_rewards_updated_at();

-- Function for managing stream_to_earn_batch_queue updated_at
CREATE OR REPLACE FUNCTION update_stream_to_earn_batch_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stream_to_earn_batch_queue_updated_at
BEFORE UPDATE ON stream_to_earn_batch_queue
FOR EACH ROW
EXECUTE FUNCTION update_stream_to_earn_batch_queue_updated_at();
