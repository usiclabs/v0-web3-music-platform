-- Uniswap V4 Pool Tracking for Market Maker Agents
CREATE TABLE IF NOT EXISTS mm_v4_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES mm_agents(id) ON DELETE CASCADE,
  pool_key JSONB NOT NULL,
  currency0 TEXT NOT NULL,
  currency1 TEXT NOT NULL,
  fee_tier INTEGER NOT NULL,
  hooks_address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  liquidity_balance NUMERIC DEFAULT 0,
  last_swap_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, currency0, currency1, fee_tier)
);

CREATE TABLE IF NOT EXISTS mm_v4_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES mm_agents(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES mm_v4_pools(id) ON DELETE CASCADE,
  swap_direction TEXT CHECK (swap_direction IN ('buy', 'sell')) NOT NULL,
  input_amount NUMERIC NOT NULL,
  output_amount NUMERIC NOT NULL,
  price_impact NUMERIC,
  transaction_hash TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  profit_loss NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mm_v4_liquidity_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES mm_agents(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES mm_v4_pools(id) ON DELETE CASCADE,
  position_id_lower NUMERIC NOT NULL,
  position_id_upper NUMERIC NOT NULL,
  liquidity NUMERIC NOT NULL,
  amount0 NUMERIC,
  amount1 NUMERIC,
  transaction_hash TEXT,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mm_v4_pools_agent ON mm_v4_pools(agent_id);
CREATE INDEX IF NOT EXISTS idx_mm_v4_pools_active ON mm_v4_pools(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_mm_v4_swaps_agent ON mm_v4_swaps(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mm_v4_swaps_status ON mm_v4_swaps(status) WHERE status IN ('pending', 'completed');
CREATE INDEX IF NOT EXISTS idx_mm_v4_liquidity_agent ON mm_v4_liquidity_positions(agent_id, status);

-- RLS Policies
ALTER TABLE mm_v4_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_v4_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_v4_liquidity_positions ENABLE ROW LEVEL SECURITY;

-- Allow agents to access their own pools and swaps via agent ownership
CREATE POLICY "agents_can_view_own_v4_pools" ON mm_v4_pools
  FOR SELECT
  USING (agent_id IN (SELECT id FROM mm_agents WHERE owner_address = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "agents_can_insert_v4_pools" ON mm_v4_pools
  FOR INSERT
  WITH CHECK (agent_id IN (SELECT id FROM mm_agents WHERE owner_address = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "agents_can_view_own_v4_swaps" ON mm_v4_swaps
  FOR SELECT
  USING (agent_id IN (SELECT id FROM mm_agents WHERE owner_address = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "agents_can_insert_v4_swaps" ON mm_v4_swaps
  FOR INSERT
  WITH CHECK (agent_id IN (SELECT id FROM mm_agents WHERE owner_address = current_setting('request.jwt.claim.sub', true)));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_mm_v4_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mm_v4_pools_updated_at_trigger
BEFORE UPDATE ON mm_v4_pools
FOR EACH ROW
EXECUTE FUNCTION update_mm_v4_pools_updated_at();
