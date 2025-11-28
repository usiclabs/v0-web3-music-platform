-- Create table to track AI generation payments
CREATE TABLE IF NOT EXISTS generation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  tx_hash TEXT,
  amount_usdc BIGINT NOT NULL,
  nonce TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_generation_payments_wallet ON generation_payments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_generation_payments_status ON generation_payments(status);
CREATE INDEX IF NOT EXISTS idx_generation_payments_nonce ON generation_payments(nonce);

-- Enable RLS
ALTER TABLE generation_payments ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own payments
CREATE POLICY "Users can view their own generation payments"
  ON generation_payments
  FOR SELECT
  USING (wallet_address = auth.jwt() ->> 'wallet_address' OR wallet_address = lower(auth.jwt() ->> 'sub'));

-- Policy for service role to insert/update
CREATE POLICY "Service role can manage generation payments"
  ON generation_payments
  FOR ALL
  USING (auth.role() = 'service_role');
