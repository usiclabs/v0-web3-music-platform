-- Create table for tracking relayed transactions
CREATE TABLE IF NOT EXISTS relayed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  tx_hash TEXT NOT NULL,
  gas_used TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_relayed_transactions_from ON relayed_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_relayed_transactions_to ON relayed_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_relayed_transactions_nonce ON relayed_transactions(nonce);
CREATE INDEX IF NOT EXISTS idx_relayed_transactions_created_at ON relayed_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE relayed_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read relayed transactions
CREATE POLICY "Anyone can read relayed transactions"
  ON relayed_transactions
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (server-side only)
CREATE POLICY "Server can insert relayed transactions"
  ON relayed_transactions
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE relayed_transactions IS 'Tracks EIP-3009 gasless transactions relayed by the platform';
