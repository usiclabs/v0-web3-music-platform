-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  query TEXT NOT NULL,
  result_type TEXT, -- 'track', 'artist', 'playlist', or NULL for all
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_address TEXT NOT NULL,
  referred_address TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_stream_at TIMESTAMP WITH TIME ZONE,
  first_upload_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_address, referred_address)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_address);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for search_history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (user_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (user_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS policies for referrals
CREATE POLICY "Anyone can view referrals"
  ON referrals FOR SELECT
  USING (true);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Referrers can update own referrals"
  ON referrals FOR UPDATE
  USING (referrer_address = current_setting('request.jwt.claims', true)::json->>'sub');
