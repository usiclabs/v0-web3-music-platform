-- ERC-8021 Builder Codes System
-- Enables third-party apps to earn revenue from activity they generate

-- Builder Code Registry Table
CREATE TABLE IF NOT EXISTS builder_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g. "phantom", "musicbot", "jarrod"
  name TEXT NOT NULL, -- Display name
  description TEXT,
  owner_address TEXT NOT NULL, -- Wallet address to receive payments
  payout_percentage NUMERIC NOT NULL DEFAULT 10.0, -- % of fees to split with builder
  total_volume NUMERIC DEFAULT 0, -- Total USDC volume generated
  total_earnings NUMERIC DEFAULT 0, -- Total USDC earned
  total_transactions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false, -- Platform-verified builders
  website_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Builder Code Usage Tracking
CREATE TABLE IF NOT EXISTS builder_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_code TEXT NOT NULL,
  track_id UUID REFERENCES tracks(id),
  listener_address TEXT NOT NULL,
  stream_id UUID REFERENCES streams(id),
  amount NUMERIC NOT NULL, -- Amount of transaction
  builder_fee NUMERIC NOT NULL, -- Fee earned by builder
  platform_fee NUMERIC NOT NULL, -- Fee retained by platform
  artist_payment NUMERIC NOT NULL, -- Payment to artist
  tx_hash TEXT, -- Transaction hash if settled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (builder_code) REFERENCES builder_codes(code)
);

-- Builder Payouts Table
CREATE TABLE IF NOT EXISTS builder_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (builder_code) REFERENCES builder_codes(code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_builder_codes_code ON builder_codes(code);
CREATE INDEX IF NOT EXISTS idx_builder_codes_owner ON builder_codes(owner_address);
CREATE INDEX IF NOT EXISTS idx_builder_code_usage_code ON builder_code_usage(builder_code);
CREATE INDEX IF NOT EXISTS idx_builder_code_usage_track ON builder_code_usage(track_id);
CREATE INDEX IF NOT EXISTS idx_builder_code_usage_created ON builder_code_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builder_payouts_code ON builder_payouts(builder_code);
CREATE INDEX IF NOT EXISTS idx_builder_payouts_status ON builder_payouts(status);

-- RLS Policies
ALTER TABLE builder_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_payouts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active builder codes
CREATE POLICY "Anyone can view active builder codes"
  ON builder_codes FOR SELECT
  USING (is_active = true);

-- Owners can update their own builder codes
CREATE POLICY "Owners can update own builder codes"
  ON builder_codes FOR UPDATE
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Anyone can insert builder codes (subject to admin approval)
CREATE POLICY "Anyone can register builder codes"
  ON builder_codes FOR INSERT
  WITH CHECK (true);

-- Anyone can view builder code usage (for transparency)
CREATE POLICY "Anyone can view builder usage"
  ON builder_code_usage FOR SELECT
  USING (true);

-- System can insert usage records
CREATE POLICY "System can insert usage"
  ON builder_code_usage FOR INSERT
  WITH CHECK (true);

-- Builders can view their own payouts
CREATE POLICY "Builders can view own payouts"
  ON builder_payouts FOR SELECT
  USING (
    builder_code IN (
      SELECT code FROM builder_codes 
      WHERE owner_address = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Function to update builder code stats
CREATE OR REPLACE FUNCTION update_builder_code_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE builder_codes
  SET
    total_volume = total_volume + NEW.amount,
    total_earnings = total_earnings + NEW.builder_fee,
    total_transactions = total_transactions + 1,
    updated_at = NOW()
  WHERE code = NEW.builder_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on new usage
CREATE TRIGGER update_builder_stats_trigger
AFTER INSERT ON builder_code_usage
FOR EACH ROW
EXECUTE FUNCTION update_builder_code_stats();

-- Function to calculate builder fee split
CREATE OR REPLACE FUNCTION calculate_builder_split(
  p_amount NUMERIC,
  p_builder_code TEXT
) RETURNS TABLE (
  builder_fee NUMERIC,
  platform_fee NUMERIC,
  artist_payment NUMERIC
) AS $$
DECLARE
  v_builder_percentage NUMERIC;
  v_total_fees NUMERIC := p_amount * 0.05; -- Assume 5% total platform fee
BEGIN
  -- Get builder's payout percentage (default 10% of fees = 0.5% of transaction)
  SELECT payout_percentage INTO v_builder_percentage
  FROM builder_codes
  WHERE code = p_builder_code AND is_active = true;
  
  IF v_builder_percentage IS NULL THEN
    v_builder_percentage := 0;
  END IF;
  
  builder_fee := v_total_fees * (v_builder_percentage / 100.0);
  platform_fee := v_total_fees - builder_fee;
  artist_payment := p_amount - v_total_fees;
  
  RETURN QUERY SELECT builder_fee, platform_fee, artist_payment;
END;
$$ LANGUAGE plpgsql;
