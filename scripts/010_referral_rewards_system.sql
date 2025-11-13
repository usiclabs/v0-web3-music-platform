-- Create comprehensive referral rewards system tables

-- Rewards tracking table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_address TEXT NOT NULL,
  referred_address TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('signup_bonus', 'first_stream', 'first_upload', 'first_purchase', 'milestone_bonus', 'leaderboard_prize')),
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  reward_currency TEXT NOT NULL DEFAULT 'USDC' CHECK (reward_currency IN ('USDC', 'credits', 'points')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  distributed_at TIMESTAMPTZ
);

-- Achievements table
CREATE TABLE IF NOT EXISTS referral_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('referral_3', 'referral_5', 'referral_10', 'referral_25', 'referral_50', 'referral_100', 'top_referrer', 'viral_growth')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_amount NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Leaderboard view
CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT 
  r.referrer_address,
  p.artist_name,
  p.avatar_url,
  COUNT(DISTINCT r.referred_address) as total_referrals,
  COUNT(DISTINCT CASE WHEN r.is_active THEN r.referred_address END) as active_referrals,
  COALESCE(SUM(rw.reward_amount) FILTER (WHERE rw.reward_currency = 'USDC'), 0) as total_usdc_earned,
  COALESCE(SUM(rw.reward_amount) FILTER (WHERE rw.reward_currency = 'points'), 0) as total_points_earned,
  MAX(r.created_at) as last_referral_at
FROM referrals r
LEFT JOIN profiles p ON r.referrer_address = p.wallet_address
LEFT JOIN referral_rewards rw ON r.referrer_address = rw.referrer_address AND rw.status = 'completed'
GROUP BY r.referrer_address, p.artist_name, p.avatar_url
ORDER BY active_referrals DESC, total_referrals DESC;

-- Share events tracking
CREATE TABLE IF NOT EXISTS share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('track', 'playlist', 'profile', 'achievement')),
  shared_id UUID,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'farcaster', 'telegram', 'discord', 'native')),
  referral_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral campaigns (for admin management)
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  reward_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_achievements_user ON referral_achievements(user_address);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_address);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);

-- RLS Policies
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards" ON referral_rewards
  FOR SELECT USING (referrer_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- System can insert rewards
CREATE POLICY "System can insert rewards" ON referral_rewards
  FOR INSERT WITH CHECK (true);

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON referral_achievements
  FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Anyone can view public achievements (for leaderboard)
CREATE POLICY "Anyone can view achievements" ON referral_achievements
  FOR SELECT USING (true);

-- Users can insert their own share events
CREATE POLICY "Users can insert share events" ON share_events
  FOR INSERT WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can view their own share history
CREATE POLICY "Users can view own shares" ON share_events
  FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Anyone can view active campaigns
CREATE POLICY "Anyone can view campaigns" ON referral_campaigns
  FOR SELECT USING (is_active = true);

-- Admin can manage campaigns (you'll need to implement admin check)
CREATE POLICY "Admin can manage campaigns" ON referral_campaigns
  FOR ALL USING (true);

COMMENT ON TABLE referral_rewards IS 'Tracks all referral rewards and their distribution status';
COMMENT ON TABLE referral_achievements IS 'Tracks unlocked referral achievements and milestones';
COMMENT ON TABLE share_events IS 'Tracks social sharing activity for analytics';
COMMENT ON TABLE referral_campaigns IS 'Admin-managed referral campaigns with custom reward structures';
