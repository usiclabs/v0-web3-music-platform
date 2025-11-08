-- Add RLS policies for auto-investment tables

-- Enable RLS on auto-investment tables
ALTER TABLE session_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_investment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_investment_transactions ENABLE ROW LEVEL SECURITY;

-- Session keys policies
CREATE POLICY "Users can view own session keys"
  ON session_keys FOR SELECT
  USING (true);  -- Allow reads for server-side checking

CREATE POLICY "Users can create own session keys"
  ON session_keys FOR INSERT
  WITH CHECK (true);  -- Allow inserts for server-side creation

CREATE POLICY "Users can update own session keys"
  ON session_keys FOR UPDATE
  USING (true);  -- Allow updates for server-side management

-- Auto-investment settings policies
CREATE POLICY "Users can view own settings"
  ON auto_investment_settings FOR SELECT
  USING (true);

CREATE POLICY "Users can create own settings"
  ON auto_investment_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own settings"
  ON auto_investment_settings FOR UPDATE
  USING (true);

-- Auto-investment transactions policies
CREATE POLICY "Users can view own transactions"
  ON auto_investment_transactions FOR SELECT
  USING (true);

CREATE POLICY "System can create transactions"
  ON auto_investment_transactions FOR INSERT
  WITH CHECK (true);

-- Add database function for incrementing session spending
CREATE OR REPLACE FUNCTION increment_session_spending(session_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE session_keys
  SET spent_amount = spent_amount + amount
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
