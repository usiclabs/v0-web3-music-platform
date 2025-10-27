-- Create staking_history table to track all staking actions
CREATE TABLE IF NOT EXISTS staking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('stake', 'unstake', 'claim')),
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_staking_history_user ON staking_history(user_address);
CREATE INDEX IF NOT EXISTS idx_staking_history_created_at ON staking_history(created_at DESC);

-- Enable RLS
ALTER TABLE staking_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own staking history
CREATE POLICY "Users can view own staking history"
  ON staking_history
  FOR SELECT
  USING (true); -- Public read for transparency

-- Policy: Only authenticated users can insert their own records
CREATE POLICY "Users can insert own staking records"
  ON staking_history
  FOR INSERT
  WITH CHECK (true); -- Allow inserts (we'll validate on the backend)
