-- ERC-8004 Trustless AI Agent Registry System
-- Extends existing agents table with Identity, Reputation, and Validation registries

-- Agent Reputation Registry
CREATE TABLE IF NOT EXISTS agent_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT NOT NULL REFERENCES agents(agent_address),
  reputation_score NUMERIC DEFAULT 0, -- 0-100 score
  total_feedback_count INTEGER DEFAULT 0,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0, -- 0-5 stars
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Validation Registry
CREATE TABLE IF NOT EXISTS agent_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT NOT NULL REFERENCES agents(agent_address),
  validator_address TEXT NOT NULL, -- Who performed validation
  validation_type TEXT NOT NULL, -- 'recommendation_quality', 'uptime', 'response_time', etc.
  result_code INTEGER NOT NULL, -- 0 = failed, 1 = passed, 2 = exceptional
  score NUMERIC, -- Optional numeric score
  evidence_uri TEXT, -- Link to detailed validation report
  tags TEXT[], -- Optional tags for categorization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT NOT NULL REFERENCES agents(agent_address),
  metric_type TEXT NOT NULL, -- 'streams_generated', 'revenue_earned', 'user_satisfaction', etc.
  metric_value NUMERIC NOT NULL,
  time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Earnings (linked to builder codes)
CREATE TABLE IF NOT EXISTS agent_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT NOT NULL REFERENCES agents(agent_address),
  builder_code TEXT REFERENCES builder_codes(code),
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL, -- 'streams', 'trades', 'referrals', etc.
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_reputation_address ON agent_reputation(agent_address);
CREATE INDEX IF NOT EXISTS idx_agent_reputation_score ON agent_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_validations_address ON agent_validations(agent_address);
CREATE INDEX IF NOT EXISTS idx_agent_validations_type ON agent_validations(validation_type);
CREATE INDEX IF NOT EXISTS idx_agent_performance_address ON agent_performance(agent_address);
CREATE INDEX IF NOT EXISTS idx_agent_performance_type ON agent_performance(metric_type);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_address ON agent_earnings(agent_address);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_code ON agent_earnings(builder_code);

-- RLS Policies
ALTER TABLE agent_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent reputation"
  ON agent_reputation FOR SELECT
  USING (true);

CREATE POLICY "System can update reputation"
  ON agent_reputation FOR UPDATE
  USING (true);

CREATE POLICY "System can insert reputation"
  ON agent_reputation FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view validations"
  ON agent_validations FOR SELECT
  USING (true);

CREATE POLICY "Validators can insert validations"
  ON agent_validations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view performance"
  ON agent_performance FOR SELECT
  USING (true);

CREATE POLICY "System can insert performance"
  ON agent_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agent owners can view earnings"
  ON agent_earnings FOR SELECT
  USING (
    agent_address IN (
      SELECT agent_address FROM agents 
      WHERE owner_address = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "System can insert earnings"
  ON agent_earnings FOR INSERT
  WITH CHECK (true);

-- Function to update reputation score when feedback is submitted
CREATE OR REPLACE FUNCTION update_agent_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_count INTEGER;
  v_positive_count INTEGER;
  v_negative_count INTEGER;
BEGIN
  -- Calculate new reputation metrics
  SELECT 
    AVG(rating),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating >= 4),
    COUNT(*) FILTER (WHERE rating <= 2)
  INTO v_avg_rating, v_total_count, v_positive_count, v_negative_count
  FROM agent_feedback
  WHERE agent_address = NEW.agent_address;
  
  -- Update or insert reputation record
  INSERT INTO agent_reputation (
    agent_address,
    reputation_score,
    total_feedback_count,
    positive_feedback_count,
    negative_feedback_count,
    average_rating,
    last_updated
  ) VALUES (
    NEW.agent_address,
    LEAST(100, (v_avg_rating / 5.0) * 100),
    v_total_count,
    v_positive_count,
    v_negative_count,
    v_avg_rating,
    NOW()
  )
  ON CONFLICT (agent_address) 
  DO UPDATE SET
    reputation_score = LEAST(100, (v_avg_rating / 5.0) * 100),
    total_feedback_count = v_total_count,
    positive_feedback_count = v_positive_count,
    negative_feedback_count = v_negative_count,
    average_rating = v_avg_rating,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reputation on new feedback
DROP TRIGGER IF EXISTS update_agent_reputation_trigger ON agent_feedback;
CREATE TRIGGER update_agent_reputation_trigger
AFTER INSERT ON agent_feedback
FOR EACH ROW
EXECUTE FUNCTION update_agent_reputation();

-- Function to get top agents by reputation
CREATE OR REPLACE FUNCTION get_top_agents(
  p_limit INTEGER DEFAULT 10,
  p_min_feedback INTEGER DEFAULT 5
) RETURNS TABLE (
  agent_address TEXT,
  name TEXT,
  description TEXT,
  reputation_score NUMERIC,
  average_rating NUMERIC,
  total_feedback_count INTEGER,
  total_actions INTEGER,
  capabilities TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.agent_address,
    a.name,
    a.description,
    COALESCE(r.reputation_score, 0),
    COALESCE(r.average_rating, 0),
    COALESCE(r.total_feedback_count, 0),
    a.total_actions,
    a.capabilities
  FROM agents a
  LEFT JOIN agent_reputation r ON a.agent_address = r.agent_address
  WHERE a.is_active = true
    AND COALESCE(r.total_feedback_count, 0) >= p_min_feedback
  ORDER BY r.reputation_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint on agent_address for reputation table
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_reputation_address_unique ON agent_reputation(agent_address);
