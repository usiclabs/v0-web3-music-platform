-- Create boosts table for tracking active boosts
CREATE TABLE IF NOT EXISTS boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boosted_by_address TEXT NOT NULL,
  artist_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  initial_usdc_funding NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  strategy_type TEXT DEFAULT 'profitable_10', -- 10% profitable strategy
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_trades INTEGER DEFAULT 0,
  total_profit_usdc NUMERIC DEFAULT 0,
  user_earnings NUMERIC DEFAULT 0,
  artist_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boost wallets table for isolated wallet management
CREATE TABLE IF NOT EXISTS boost_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id UUID NOT NULL REFERENCES boosts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  private_key_encrypted TEXT NOT NULL,
  eth_balance NUMERIC DEFAULT 0,
  usdc_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boost activity table for tracking all trades
CREATE TABLE IF NOT EXISTS boost_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id UUID NOT NULL REFERENCES boosts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'buy', 'sell', 'profit', 'loss'
  tx_hash TEXT,
  token_amount NUMERIC,
  usdc_amount NUMERIC,
  price_per_token NUMERIC,
  profit_loss NUMERIC,
  slippage_percent NUMERIC,
  gas_used NUMERIC,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boosts
CREATE POLICY "Users can view their own boosts" ON boosts
  FOR SELECT USING (auth.uid()::text = boosted_by_address OR auth.uid()::text = artist_address);

CREATE POLICY "Users can create boosts" ON boosts
  FOR INSERT WITH CHECK (auth.uid()::text = boosted_by_address);

CREATE POLICY "Anyone can view public boost activity" ON boosts
  FOR SELECT USING (true);

-- RLS Policies for boost_wallets (service role only)
CREATE POLICY "Service can manage boost wallets" ON boost_wallets
  FOR ALL USING (true);

-- RLS Policies for boost_activity
CREATE POLICY "Users can view boost activity" ON boost_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boosts 
      WHERE boosts.id = boost_activity.boost_id
      AND (auth.uid()::text = boosted_by_address OR auth.uid()::text = artist_address)
    )
  );

CREATE POLICY "Service can log activity" ON boost_activity
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_boosts_boosted_by ON boosts(boosted_by_address);
CREATE INDEX idx_boosts_artist ON boosts(artist_address);
CREATE INDEX idx_boosts_token ON boosts(token_address);
CREATE INDEX idx_boost_activity_boost_id ON boost_activity(boost_id);
CREATE INDEX idx_boost_wallets_boost_id ON boost_wallets(boost_id);
