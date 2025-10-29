-- Add auto-investment tables for session-based automated purchases

-- Session keys table for storing authorized sessions
CREATE TABLE IF NOT EXISTS session_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  session_key TEXT NOT NULL,
  spending_limit DECIMAL(20, 6) NOT NULL DEFAULT 10.0,
  spent_amount DECIMAL(20, 6) NOT NULL DEFAULT 0.0,
  max_per_transaction DECIMAL(20, 6) NOT NULL DEFAULT 1.0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_address, session_key)
);

-- Auto-investment settings table
CREATE TABLE IF NOT EXISTS auto_investment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  daily_limit DECIMAL(20, 6) NOT NULL DEFAULT 10.0,
  per_track_limit DECIMAL(20, 6) NOT NULL DEFAULT 1.0,
  auto_unlock_full_songs BOOLEAN NOT NULL DEFAULT false,
  preferred_artists TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-investment transactions table
CREATE TABLE IF NOT EXISTS auto_investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id),
  amount DECIMAL(20, 6) NOT NULL,
  chunk_index INTEGER NOT NULL,
  session_key_id UUID REFERENCES session_keys(id),
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_keys_user ON session_keys(user_address);
CREATE INDEX IF NOT EXISTS idx_session_keys_active ON session_keys(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_auto_investment_settings_user ON auto_investment_settings(user_address);
CREATE INDEX IF NOT EXISTS idx_auto_investment_transactions_user ON auto_investment_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_auto_investment_transactions_track ON auto_investment_transactions(track_id);
