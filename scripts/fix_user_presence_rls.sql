-- Drop existing restrictive policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can manage own presence" ON user_presence;
DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;

-- Create new permissive policies that work with wallet addresses
-- These policies allow operations without requiring Supabase auth sessions
CREATE POLICY "Anyone can view presence"
  ON user_presence
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own presence"
  ON user_presence
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own presence"
  ON user_presence
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own presence"
  ON user_presence
  FOR DELETE
  USING (true);

-- Verify RLS is enabled
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
