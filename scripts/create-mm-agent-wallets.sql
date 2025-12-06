-- Add support for multiple wallets per MM agent

-- Create mm_agent_wallets table to store multiple wallets
CREATE TABLE IF NOT EXISTS mm_agent_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES mm_agents(id) ON DELETE CASCADE,
  wallet_index INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_buys INTEGER DEFAULT 0,
  total_sells INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, wallet_index)
);

-- Add multi_wallet_mode to mm_agents
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS multi_wallet_mode BOOLEAN DEFAULT false;
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS active_wallets INTEGER DEFAULT 1;

-- Add wallet_address to mm_agent_activity to track which wallet executed
ALTER TABLE mm_agent_activity ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Enable RLS
ALTER TABLE mm_agent_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mm_agent_wallets
CREATE POLICY "Users can view own agent wallets"
  ON mm_agent_wallets FOR SELECT
  USING (agent_id IN (SELECT id FROM mm_agents WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Service role has full access to agent wallets"
  ON mm_agent_wallets FOR ALL
  USING (current_user = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mm_agent_wallets_agent_id ON mm_agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_mm_agent_wallets_active ON mm_agent_wallets(agent_id, is_active);
