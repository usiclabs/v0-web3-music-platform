-- Eliza Agent Tables in Supabase
CREATE TABLE IF NOT EXISTS eliza_agents (
  id TEXT PRIMARY KEY,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  personality TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  wallet_address TEXT,
  memory_budget_mb INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eliza_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES eliza_agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 0 AND importance <= 10),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eliza_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES eliza_agents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('pending', 'executing', 'completed', 'failed')) DEFAULT 'pending',
  result TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_eliza_agents_owner ON eliza_agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_eliza_agents_active ON eliza_agents(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_eliza_memory_agent ON eliza_memory(agent_id, importance DESC, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eliza_actions_agent ON eliza_actions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eliza_actions_status ON eliza_actions(status) WHERE status IN ('pending', 'executing');

-- Enable Row Level Security
ALTER TABLE eliza_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliza_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliza_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS eliza_agents_owner_policy ON eliza_agents
  FOR ALL USING (owner_address = auth.uid()::text);

CREATE POLICY IF NOT EXISTS eliza_memory_owner_policy ON eliza_memory
  FOR ALL USING (
    agent_id IN (SELECT id FROM eliza_agents WHERE owner_address = auth.uid()::text)
  );

CREATE POLICY IF NOT EXISTS eliza_actions_owner_policy ON eliza_actions
  FOR ALL USING (
    agent_id IN (SELECT id FROM eliza_agents WHERE owner_address = auth.uid()::text)
  );

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_eliza_agent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS eliza_agent_updated_at_trigger
BEFORE UPDATE ON eliza_agents
FOR EACH ROW
EXECUTE FUNCTION update_eliza_agent_updated_at();
