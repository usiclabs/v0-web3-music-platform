-- Create boosts table
CREATE TABLE IF NOT EXISTS public.boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address text NOT NULL,
  artist_address text NOT NULL,
  token_address text NOT NULL,
  token_symbol text,
  initial_eth_funding numeric NOT NULL,
  current_balance numeric DEFAULT 0,
  total_spent_eth numeric DEFAULT 0,
  total_earned_eth numeric DEFAULT 0,
  strategy_type text DEFAULT '10-percent-profitable',
  status text DEFAULT 'active',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(owner_address, token_address)
);

-- Create boost_wallets table
CREATE TABLE IF NOT EXISTS public.boost_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id uuid NOT NULL REFERENCES public.boosts(id) ON DELETE CASCADE,
  wallet_address text NOT NULL UNIQUE,
  private_key_encrypted text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create boost_activity table
CREATE TABLE IF NOT EXISTS public.boost_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id uuid NOT NULL REFERENCES public.boosts(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  tx_hash text,
  amount_traded numeric,
  profit_loss numeric,
  gas_fee numeric,
  created_at timestamp DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS boosts_owner_idx ON boosts(owner_address);
CREATE INDEX IF NOT EXISTS boosts_artist_idx ON boosts(artist_address);
CREATE INDEX IF NOT EXISTS boosts_token_idx ON boosts(token_address);
CREATE INDEX IF NOT EXISTS boost_wallets_boost_idx ON boost_wallets(boost_id);
CREATE INDEX IF NOT EXISTS boost_activity_boost_idx ON boost_activity(boost_id);

-- Enable RLS
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_activity ENABLE ROW LEVEL SECURITY;

-- Boosts RLS policies
CREATE POLICY "Users can view their own boosts" ON boosts
  FOR SELECT
  USING (owner_address = auth.uid()::text OR auth.uid() IS NULL);

CREATE POLICY "Users can create boosts" ON boosts
  FOR INSERT
  WITH CHECK (owner_address = auth.uid()::text);

-- Boost wallets RLS policies
CREATE POLICY "Service role can manage wallets" ON boost_wallets
  FOR ALL
  USING (true);

-- Boost activity RLS policies
CREATE POLICY "Users can view their boost activity" ON boost_activity
  FOR SELECT
  USING (boost_id IN (SELECT id FROM boosts WHERE owner_address = auth.uid()::text));
