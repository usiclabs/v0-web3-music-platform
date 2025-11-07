-- Create agents table to store ERC-8004 registered agents
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT UNIQUE NOT NULL,
  agent_id TEXT, -- Token ID from ERC-8004 NFT
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  api_endpoint TEXT,
  websocket_endpoint TEXT,
  metadata_uri TEXT, -- IPFS or blob storage URL
  owner_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  total_actions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Anyone can view active agents
CREATE POLICY "Anyone can view active agents" ON agents
  FOR SELECT USING (is_active = true);

-- Owners can insert their own agents
CREATE POLICY "Owners can register agents" ON agents
  FOR INSERT WITH CHECK (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Owners can update their own agents
CREATE POLICY "Owners can update own agents" ON agents
  FOR UPDATE USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create indexes
CREATE INDEX IF NOT EXISTS agents_address_idx ON agents(agent_address);
CREATE INDEX IF NOT EXISTS agents_owner_idx ON agents(owner_address);
CREATE INDEX IF NOT EXISTS agents_active_idx ON agents(is_active);
