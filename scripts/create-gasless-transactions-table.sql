-- Create table for tracking gasless transactions
CREATE TABLE IF NOT EXISTS gasless_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  gas_amount TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gasless_transactions_user ON gasless_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_gasless_transactions_created ON gasless_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE gasless_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own gasless transactions
CREATE POLICY "Users can view own gasless transactions"
  ON gasless_transactions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Service role can insert gasless transactions
CREATE POLICY "Service role can insert gasless transactions"
  ON gasless_transactions
  FOR INSERT
  WITH CHECK (true);
