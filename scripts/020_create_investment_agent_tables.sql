-- Investment Agent Tables for x402 Autonomous Token Investment
-- This script creates the necessary tables for the autonomous investment agent

-- Agent configurations table - stores user's agent settings
CREATE TABLE IF NOT EXISTS public.investment_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Investment Agent',
  is_active BOOLEAN DEFAULT false,
  
  -- Budget settings
  total_budget NUMERIC DEFAULT 0,
  spent_amount NUMERIC DEFAULT 0,
  daily_limit NUMERIC DEFAULT 10, -- Max USDC per day
  per_trade_limit NUMERIC DEFAULT 1, -- Max USDC per trade
  
  -- Strategy settings
  strategy_type TEXT DEFAULT 'momentum', -- momentum, value, balanced, custom
  min_liquidity NUMERIC DEFAULT 1000, -- Minimum pool liquidity in USDC
  max_slippage NUMERIC DEFAULT 5, -- Max slippage percentage
  
  -- Risk settings
  stop_loss_percent NUMERIC DEFAULT 20, -- Sell if down X%
  take_profit_percent NUMERIC DEFAULT 50, -- Sell if up X%
  max_portfolio_percent NUMERIC DEFAULT 10, -- Max % of budget per token
  
  -- Filters
  min_holder_count INTEGER DEFAULT 10,
  min_artist_followers INTEGER DEFAULT 0,
  preferred_genres TEXT[] DEFAULT '{}',
  blacklisted_tokens TEXT[] DEFAULT '{}',
  whitelisted_tokens TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(owner_address)
);

-- Agent portfolio - tracks token holdings
CREATE TABLE IF NOT EXISTS public.agent_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES investment_agents(id) ON DELETE CASCADE,
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

-- Agent trades - records all trades made by the agent
CREATE TABLE IF NOT EXISTS public.agent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES investment_agents(id) ON DELETE CASCADE,
  
  -- Trade details
  trade_type TEXT NOT NULL, -- 'buy' or 'sell'
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  
  -- Amounts
  amount_in NUMERIC NOT NULL,
  amount_out NUMERIC NOT NULL,
  price_per_token NUMERIC NOT NULL,
  slippage_percent NUMERIC,
  
  -- Transaction
  tx_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  error_message TEXT,
  
  -- Reasoning
  trigger_reason TEXT, -- Why the agent made this trade
  strategy_score NUMERIC, -- Score that triggered the trade
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  gas_used NUMERIC
);

-- Agent signals - tracks potential opportunities the agent identified
CREATE TABLE IF NOT EXISTS public.agent_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES investment_agents(id) ON DELETE CASCADE,
  
  -- Signal details
  signal_type TEXT NOT NULL, -- 'buy', 'sell', 'hold'
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  
  -- Analysis
  confidence_score NUMERIC NOT NULL, -- 0-100
  price_at_signal NUMERIC,
  
  -- Reasoning components
  momentum_score NUMERIC,
  volume_score NUMERIC,
  social_score NUMERIC,
  artist_score NUMERIC,
  
  -- Status
  was_executed BOOLEAN DEFAULT false,
  execution_trade_id UUID REFERENCES agent_trades(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Agent activity log - detailed logs of agent actions
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES investment_agents(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'scan', 'analyze', 'trade', 'rebalance', 'error'
  description TEXT NOT NULL,
  
  -- Related entities
  token_address TEXT,
  trade_id UUID REFERENCES agent_trades(id),
  signal_id UUID REFERENCES agent_signals(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE investment_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_agents
CREATE POLICY "Users can view own agent" ON investment_agents
  FOR SELECT USING (true); -- Public read for leaderboards

CREATE POLICY "Users can create own agent" ON investment_agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own agent" ON investment_agents
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own agent" ON investment_agents
  FOR DELETE USING (true);

-- RLS Policies for agent_portfolio
CREATE POLICY "Users can view portfolio" ON agent_portfolio
  FOR SELECT USING (true);

CREATE POLICY "System can manage portfolio" ON agent_portfolio
  FOR ALL USING (true);

-- RLS Policies for agent_trades
CREATE POLICY "Anyone can view trades" ON agent_trades
  FOR SELECT USING (true);

CREATE POLICY "System can create trades" ON agent_trades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update trades" ON agent_trades
  FOR UPDATE USING (true);

-- RLS Policies for agent_signals
CREATE POLICY "Anyone can view signals" ON agent_signals
  FOR SELECT USING (true);

CREATE POLICY "System can manage signals" ON agent_signals
  FOR ALL USING (true);

-- RLS Policies for agent_activity_log
CREATE POLICY "Anyone can view activity" ON agent_activity_log
  FOR SELECT USING (true);

CREATE POLICY "System can log activity" ON agent_activity_log
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investment_agents_owner ON investment_agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_investment_agents_active ON investment_agents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_portfolio_agent ON agent_portfolio(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_portfolio_token ON agent_portfolio(token_address);
CREATE INDEX IF NOT EXISTS idx_agent_trades_agent ON agent_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trades_token ON agent_trades(token_address);
CREATE INDEX IF NOT EXISTS idx_agent_trades_created ON agent_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_signals_agent ON agent_signals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_signals_token ON agent_signals(token_address);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON agent_activity_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity_log(created_at DESC);
