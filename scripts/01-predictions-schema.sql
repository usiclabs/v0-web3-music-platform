-- Prediction Markets Tables

-- Main predictions_markets table
CREATE TABLE IF NOT EXISTS prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streams', 'market_cap', 'followers', 'revenue')),
  target_type TEXT NOT NULL CHECK (target_type IN ('token', 'artist', 'track')),
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  target_image_url TEXT,
  outcome_metric TEXT NOT NULL,
  outcome_threshold DECIMAL(20, 8) NOT NULL,
  outcome_operator TEXT NOT NULL DEFAULT '>=' CHECK (outcome_operator IN ('>=', '>', '<=', '<', '=')),
  resolution_date TIMESTAMPTZ NOT NULL,
  creator_address TEXT NOT NULL,
  verification_source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  yes_pool DECIMAL(20, 8) NOT NULL DEFAULT 100,
  no_pool DECIMAL(20, 8) NOT NULL DEFAULT 100,
  total_volume DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_yes_volume DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_no_volume DECIMAL(20, 8) NOT NULL DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  resolution_value DECIMAL(20, 8),
  outcome_result BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_resolution CHECK (
    (is_active = true AND resolved_at IS NULL AND resolution_value IS NULL AND outcome_result IS NULL) OR
    (is_active = false AND resolved_at IS NOT NULL AND resolution_value IS NOT NULL AND outcome_result IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_prediction_markets_creator ON prediction_markets(creator_address);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_is_active ON prediction_markets(is_active);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_category ON prediction_markets(category);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_target ON prediction_markets(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_resolution_date ON prediction_markets(resolution_date);

-- Prediction positions (user bets)
CREATE TABLE IF NOT EXISTS prediction_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  outcome_side TEXT NOT NULL CHECK (outcome_side IN ('YES', 'NO')),
  shares DECIMAL(20, 8) NOT NULL,
  avg_price DECIMAL(20, 8) NOT NULL,
  total_invested DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 8) NOT NULL,
  unrealized_pnl DECIMAL(20, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(market_id, user_address, outcome_side)
);

CREATE INDEX IF NOT EXISTS idx_prediction_positions_user ON prediction_positions(user_address);
CREATE INDEX IF NOT EXISTS idx_prediction_positions_market ON prediction_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_positions_status ON prediction_positions(status);

-- Individual trades
CREATE TABLE IF NOT EXISTS prediction_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  outcome_side TEXT NOT NULL CHECK (outcome_side IN ('YES', 'NO')),
  shares DECIMAL(20, 8) NOT NULL,
  price_per_share DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  yes_probability DECIMAL(5, 2),
  no_probability DECIMAL(5, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  transaction_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prediction_trades_user ON prediction_trades(user_address);
CREATE INDEX IF NOT EXISTS idx_prediction_trades_market ON prediction_trades(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_trades_status ON prediction_trades(status);

-- Prediction payouts
CREATE TABLE IF NOT EXISTS prediction_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  winning_side TEXT NOT NULL CHECK (winning_side IN ('YES', 'NO')),
  shares_held DECIMAL(20, 8) NOT NULL,
  payout_amount DECIMAL(20, 8) NOT NULL,
  profit_amount DECIMAL(20, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prediction_payouts_user ON prediction_payouts(user_address);
CREATE INDEX IF NOT EXISTS idx_prediction_payouts_market ON prediction_payouts(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_payouts_status ON prediction_payouts(status);

-- Market activity log
CREATE TABLE IF NOT EXISTS prediction_market_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prediction_market_activity_market ON prediction_market_activity(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_market_activity_type ON prediction_market_activity(activity_type);

-- Enable RLS
ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_market_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- prediction_markets: everyone can read, only creator can update
CREATE POLICY "prediction_markets_read" ON prediction_markets
  FOR SELECT USING (true);

CREATE POLICY "prediction_markets_create" ON prediction_markets
  FOR INSERT WITH CHECK (creator_address = LOWER(auth.jwt() ->> 'address'));

CREATE POLICY "prediction_markets_update_creator" ON prediction_markets
  FOR UPDATE USING (creator_address = LOWER(auth.jwt() ->> 'address'));

-- prediction_positions: users can only see their own, insert/update their own
CREATE POLICY "prediction_positions_read" ON prediction_positions
  FOR SELECT USING (user_address = LOWER(auth.jwt() ->> 'address'));

CREATE POLICY "prediction_positions_insert" ON prediction_positions
  FOR INSERT WITH CHECK (user_address = LOWER(auth.jwt() ->> 'address'));

CREATE POLICY "prediction_positions_update" ON prediction_positions
  FOR UPDATE USING (user_address = LOWER(auth.jwt() ->> 'address'));

-- prediction_trades: users can only see their own
CREATE POLICY "prediction_trades_read" ON prediction_trades
  FOR SELECT USING (user_address = LOWER(auth.jwt() ->> 'address'));

CREATE POLICY "prediction_trades_insert" ON prediction_trades
  FOR INSERT WITH CHECK (user_address = LOWER(auth.jwt() ->> 'address'));

-- prediction_payouts: users can only see their own
CREATE POLICY "prediction_payouts_read" ON prediction_payouts
  FOR SELECT USING (user_address = LOWER(auth.jwt() ->> 'address'));

-- prediction_market_activity: everyone can read
CREATE POLICY "prediction_market_activity_read" ON prediction_market_activity
  FOR SELECT USING (true);
