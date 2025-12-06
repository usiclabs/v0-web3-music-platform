-- Create Market Maker Agents table
CREATE TABLE IF NOT EXISTS mm_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  buy_amount_eth TEXT DEFAULT '0.0001',
  buy_interval_minutes INTEGER DEFAULT 5,
  sell_interval_minutes INTEGER DEFAULT 10,
  last_buy_at TIMESTAMPTZ,
  last_sell_at TIMESTAMPTZ,
  total_volume_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active agents
CREATE INDEX IF NOT EXISTS idx_mm_agents_active ON mm_agents(is_active);

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_mm_agents_wallet ON mm_agents(wallet_address);

-- Add RLS policies
ALTER TABLE mm_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view MM agents"
  ON mm_agents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert MM agents"
  ON mm_agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own MM agents"
  ON mm_agents FOR UPDATE
  TO authenticated
  USING (true);
