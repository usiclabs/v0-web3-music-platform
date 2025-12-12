-- Create a dedicated portfolio table for MM agents instead of using investment_agents table
CREATE TABLE IF NOT EXISTS public.mm_agent_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES mm_agents(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  token_name TEXT,
  
  -- Holdings
  amount NUMERIC NOT NULL DEFAULT 0,
  avg_buy_price NUMERIC NOT NULL DEFAULT 0,
  total_invested NUMERIC NOT NULL DEFAULT 0,
  
  -- Performance
  current_value NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  
  -- Metadata
  first_buy_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agent_id, token_address)
);

-- Enable RLS
ALTER TABLE mm_agent_portfolio ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view mm portfolio" ON mm_agent_portfolio;
CREATE POLICY "Users can view mm portfolio" ON mm_agent_portfolio FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage mm portfolio" ON mm_agent_portfolio;
CREATE POLICY "System can manage mm portfolio" ON mm_agent_portfolio FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mm_agent_portfolio_agent ON mm_agent_portfolio(agent_id);
CREATE INDEX IF NOT EXISTS idx_mm_agent_portfolio_token ON mm_agent_portfolio(token_address);
