-- Create music_streaming_agents table
CREATE TABLE IF NOT EXISTS music_streaming_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_play_enabled BOOLEAN DEFAULT true,
  preferred_genres TEXT[] DEFAULT '{}',
  preferred_artists TEXT[] DEFAULT '{}',
  daily_listening_limit INTEGER DEFAULT 480, -- 8 hours in minutes
  minutes_listened_today INTEGER DEFAULT 0,
  auto_like_threshold INTEGER DEFAULT 70, -- Auto-like tracks scoring 70+
  auto_follow_artists BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- Create token_sniper_agents table
CREATE TABLE IF NOT EXISTS token_sniper_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_buy_enabled BOOLEAN DEFAULT true,
  buy_amount_usdc NUMERIC DEFAULT 10.0,
  max_daily_buys INTEGER DEFAULT 5,
  buys_today INTEGER DEFAULT 0,
  min_artist_followers INTEGER DEFAULT 10,
  whitelist_artists TEXT[] DEFAULT '{}',
  blacklist_artists TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- RLS policies for music_streaming_agents
ALTER TABLE music_streaming_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaming agents"
  ON music_streaming_agents FOR SELECT
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own streaming agents"
  ON music_streaming_agents FOR INSERT
  WITH CHECK (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own streaming agents"
  ON music_streaming_agents FOR UPDATE
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own streaming agents"
  ON music_streaming_agents FOR DELETE
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS policies for token_sniper_agents
ALTER TABLE token_sniper_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sniper agents"
  ON token_sniper_agents FOR SELECT
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own sniper agents"
  ON token_sniper_agents FOR INSERT
  WITH CHECK (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own sniper agents"
  ON token_sniper_agents FOR UPDATE
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own sniper agents"
  ON token_sniper_agents FOR DELETE
  USING (owner_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create function to reset daily counters at midnight
CREATE OR REPLACE FUNCTION reset_daily_agent_counters()
RETURNS void AS $$
BEGIN
  UPDATE music_streaming_agents SET minutes_listened_today = 0;
  UPDATE token_sniper_agents SET buys_today = 0;
END;
$$ LANGUAGE plpgsql;
