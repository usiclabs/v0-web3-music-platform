-- Prediction Markets for MusicFi Platform
-- Users can bet on artist success metrics: streams, market cap, followers, revenue, etc.

-- Prediction Markets table
CREATE TABLE IF NOT EXISTS public.prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Market details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'streams', 'market_cap', 'followers', 'revenue', 'custom'
  
  -- Target metrics
  target_type TEXT NOT NULL, -- 'artist', 'track', 'token'
  target_id TEXT NOT NULL, -- artist_address, track_id, or token_address
  target_name TEXT NOT NULL, -- Display name
  target_image_url TEXT,
  
  -- Outcome definition
  outcome_metric TEXT NOT NULL, -- 'stream_count', 'market_cap_usd', 'follower_count', 'revenue_usd'
  outcome_threshold NUMERIC NOT NULL, -- Target value to reach
  outcome_operator TEXT DEFAULT '>=' CHECK (outcome_operator IN ('>=', '>', '<=', '<', '=')),
  
  -- Market mechanics
  resolution_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_value NUMERIC, -- Actual value at resolution
  outcome_result BOOLEAN, -- true = YES won, false = NO won, null = unresolved
  
  -- Market state
  is_active BOOLEAN DEFAULT true,
  total_yes_volume NUMERIC DEFAULT 0,
  total_no_volume NUMERIC DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  
  -- Liquidity pool (for AMM-style pricing)
  yes_pool NUMERIC DEFAULT 100, -- Initial liquidity
  no_pool NUMERIC DEFAULT 100,  -- Initial liquidity
  
  -- Creator info
  creator_address TEXT NOT NULL,
  
  -- Metadata
  verification_source TEXT, -- 'dexscreener', 'supabase_streams', 'on_chain'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Prediction Positions table (user holdings)
CREATE TABLE IF NOT EXISTS public.prediction_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  
  -- Position details
  outcome_side TEXT NOT NULL CHECK (outcome_side IN ('YES', 'NO')),
  shares NUMERIC NOT NULL DEFAULT 0, -- Number of outcome tokens held
  avg_price NUMERIC NOT NULL, -- Average price paid per share
  total_invested NUMERIC NOT NULL, -- Total USDC invested
  
  -- Performance
  current_value NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  
  -- Timestamps
  first_buy_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(market_id, user_address, outcome_side)
);

-- Prediction Trades table (order history)
CREATE TABLE IF NOT EXISTS public.prediction_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  
  -- Trade details
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  outcome_side TEXT NOT NULL CHECK (outcome_side IN ('YES', 'NO')),
  shares NUMERIC NOT NULL,
  price_per_share NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  
  -- Market state at trade
  yes_probability NUMERIC, -- Implied probability at time of trade
  no_probability NUMERIC,
  
  -- Transaction
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Prediction Payouts table (resolution payments)
CREATE TABLE IF NOT EXISTS public.prediction_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  
  -- Payout details
  winning_side TEXT NOT NULL CHECK (winning_side IN ('YES', 'NO')),
  shares_held NUMERIC NOT NULL,
  payout_amount NUMERIC NOT NULL, -- $1 per winning share
  profit_amount NUMERIC NOT NULL, -- payout - cost_basis
  
  -- Transaction
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prediction_markets
CREATE POLICY "Anyone can view active markets" ON prediction_markets
  FOR SELECT USING (is_active = true OR resolved_at IS NOT NULL);

CREATE POLICY "Users can create markets" ON prediction_markets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can update own markets" ON prediction_markets
  FOR UPDATE USING (true);

-- RLS Policies for prediction_positions
CREATE POLICY "Users can view own positions" ON prediction_positions
  FOR SELECT USING (true);

CREATE POLICY "System can manage positions" ON prediction_positions
  FOR ALL USING (true);

-- RLS Policies for prediction_trades
CREATE POLICY "Anyone can view trades" ON prediction_trades
  FOR SELECT USING (true);

CREATE POLICY "Users can create trades" ON prediction_trades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update trades" ON prediction_trades
  FOR UPDATE USING (true);

-- RLS Policies for prediction_payouts
CREATE POLICY "Users can view own payouts" ON prediction_payouts
  FOR SELECT USING (true);

CREATE POLICY "System can manage payouts" ON prediction_payouts
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_markets_active ON prediction_markets(is_active, resolution_date);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_category ON prediction_markets(category);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_target ON prediction_markets(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_creator ON prediction_markets(creator_address);

CREATE INDEX IF NOT EXISTS idx_prediction_positions_market ON prediction_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_positions_user ON prediction_positions(user_address);

CREATE INDEX IF NOT EXISTS idx_prediction_trades_market ON prediction_trades(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_trades_user ON prediction_trades(user_address);
CREATE INDEX IF NOT EXISTS idx_prediction_trades_created ON prediction_trades(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_payouts_market ON prediction_payouts(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_payouts_user ON prediction_payouts(user_address);
