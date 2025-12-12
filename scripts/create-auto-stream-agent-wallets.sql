-- Create auto_stream_agent_wallets table to store wallets for auto-stream agents
CREATE TABLE IF NOT EXISTS auto_stream_agent_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auto_stream_agents(id) ON DELETE CASCADE NOT NULL,
  wallet_number INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  eth_balance NUMERIC DEFAULT 0,
  usdc_balance NUMERIC DEFAULT 0,
  last_stream_at TIMESTAMP WITH TIME ZONE,
  total_streams INTEGER DEFAULT 0,
  total_paid NUMERIC(20, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, wallet_number),
  UNIQUE(wallet_address)
);

-- Enable RLS
ALTER TABLE auto_stream_agent_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their agent wallets"
  ON auto_stream_agent_wallets FOR SELECT
  USING (agent_id IN (
    SELECT id FROM auto_stream_agents 
    WHERE owner_address = auth.uid()::text 
    OR owner_address IN (
      SELECT address FROM user_wallets WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Service can manage agent wallets"
  ON auto_stream_agent_wallets FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_stream_agent_wallets_agent_id ON auto_stream_agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_auto_stream_agent_wallets_active ON auto_stream_agent_wallets(agent_id, is_active);
CREATE INDEX IF NOT EXISTS idx_auto_stream_agent_wallets_address ON auto_stream_agent_wallets(wallet_address);
