-- Create X402 Sessions table for wallet-based track ownership
CREATE TABLE IF NOT EXISTS x402_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  chain_id INTEGER NOT NULL,
  signature TEXT, -- CAIP-122 Sign-In-With-X signature (optional)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, track_id)
);

-- Index for fast ownership lookups
CREATE INDEX IF NOT EXISTS idx_x402_sessions_wallet_track 
  ON x402_sessions(wallet_address, track_id) 
  WHERE expires_at > NOW();

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_x402_sessions_expires 
  ON x402_sessions(expires_at);

-- RLS Policies
ALTER TABLE x402_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON x402_sessions
  FOR SELECT
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Server can create sessions after payment
CREATE POLICY "Server can create sessions"
  ON x402_sessions
  FOR INSERT
  WITH CHECK (true);

-- Server can update last_accessed_at
CREATE POLICY "Server can update sessions"
  ON x402_sessions
  FOR UPDATE
  USING (true);

COMMENT ON TABLE x402_sessions IS 'X402 V2: Wallet-based sessions for track ownership and replay without re-payment';
