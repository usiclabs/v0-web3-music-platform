-- Update boosts table to support ETH instead of USDC
-- First, add new columns for ETH
ALTER TABLE boosts 
ADD COLUMN IF NOT EXISTS initial_eth_funding numeric,
ADD COLUMN IF NOT EXISTS eth_balance numeric,
ADD COLUMN IF NOT EXISTS total_earned_eth numeric DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS boosts_boosted_by_idx ON boosts(boosted_by_address);
CREATE INDEX IF NOT EXISTS boosts_artist_idx ON boosts(artist_address);
CREATE INDEX IF NOT EXISTS boosts_token_idx ON boosts(token_address);

-- Update boost_wallets table to properly support ETH
ALTER TABLE boost_wallets
ADD COLUMN IF NOT EXISTS eth_balance numeric DEFAULT 0,
MODIFY COLUMN usdc_balance numeric DEFAULT 0;

-- Update RLS policies for boosts table to allow service role and owner access
DROP POLICY IF EXISTS "Users can create boosts" ON boosts;
CREATE POLICY "Service and users can create boosts"
ON boosts FOR INSERT
WITH CHECK (
  (auth.role() = 'service_role') OR
  (auth.uid()::text = boosted_by_address)
);

-- Allow users to view their own boosts
DROP POLICY IF EXISTS "Users can view their own boosts" ON boosts;
CREATE POLICY "Users can view their own boosts"
ON boosts FOR SELECT
USING (
  (auth.uid()::text = boosted_by_address) OR
  (auth.role() = 'service_role')
);

-- Allow public to view boost activity
DROP POLICY IF EXISTS "Anyone can view public boost activity" ON boosts;
CREATE POLICY "Anyone can view public boost activity"
ON boosts FOR SELECT
USING (true);

-- Update boost_wallets RLS policy
DROP POLICY IF EXISTS "Service can manage boost wallets" ON boost_wallets;
CREATE POLICY "Service and system can manage boost wallets"
ON boost_wallets FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Update boost_activity RLS policies
DROP POLICY IF EXISTS "Service can log activity" ON boost_activity;
CREATE POLICY "Service can log boost activity"
ON boost_activity FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view boost activity" ON boost_activity;
CREATE POLICY "Users can view boost activity"
ON boost_activity FOR SELECT
USING (true);
