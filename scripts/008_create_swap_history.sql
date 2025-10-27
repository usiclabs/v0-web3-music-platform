-- Create swap_history table for tracking token swaps
CREATE TABLE IF NOT EXISTS swap_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in TEXT NOT NULL,
  amount_out TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_swap_history_user ON swap_history(user_address);
CREATE INDEX IF NOT EXISTS idx_swap_history_created ON swap_history(created_at DESC);

-- Enable RLS
ALTER TABLE swap_history ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own swap history
CREATE POLICY "Users can view own swap history"
  ON swap_history
  FOR SELECT
  USING (true);

-- Allow users to insert their own swap history
CREATE POLICY "Users can insert own swap history"
  ON swap_history
  FOR INSERT
  WITH CHECK (true);
