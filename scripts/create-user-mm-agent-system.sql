-- Complete migration for user-specific MM agents with proper RLS

-- Update mm_agents to link to user and support custom token
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS owner_address TEXT;
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS token_address TEXT DEFAULT '0x987603A52d8B966E10FBD29DcB1A574049E25B07';
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS token_symbol TEXT DEFAULT 'USI';

-- Update mm_agent_wallets to store encrypted private keys per user agent
ALTER TABLE mm_agent_wallets DROP COLUMN IF EXISTS encrypted_private_key;
ALTER TABLE mm_agent_wallets ADD COLUMN IF NOT EXISTS private_key_encrypted TEXT NOT NULL;

-- Add ETH balance tracking
ALTER TABLE mm_agent_wallets ADD COLUMN IF NOT EXISTS eth_balance NUMERIC DEFAULT 0;
ALTER TABLE mm_agent_wallets ADD COLUMN IF NOT EXISTS token_balance NUMERIC DEFAULT 0;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own agent wallets" ON mm_agent_wallets;
DROP POLICY IF EXISTS "Users can view own mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Users can insert own mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Users can update own mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Service role full access to mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Service role full access to mm agent wallets" ON mm_agent_wallets;

-- RLS policies for mm_agents table
CREATE POLICY "Users can view own mm agents"
  ON mm_agents FOR SELECT
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert own mm agents"
  ON mm_agents FOR INSERT
  WITH CHECK (owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update own mm agents"
  ON mm_agents FOR UPDATE
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Service role always has full access to mm_agents
CREATE POLICY "Service role full access to mm agents"
  ON mm_agents FOR ALL
  USING (auth.role() = 'service_role');

-- RLS policies for mm_agent_wallets table
CREATE POLICY "Users can view own agent wallets"
  ON mm_agent_wallets FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM mm_agents 
      WHERE owner_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Service role needs INSERT permission for wallet generation
CREATE POLICY "Service role full access to mm agent wallets"
  ON mm_agent_wallets FOR ALL
  USING (auth.role() = 'service_role');

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_mm_agents_owner_address ON mm_agents(owner_address);
