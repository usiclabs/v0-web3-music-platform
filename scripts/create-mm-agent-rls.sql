-- Add RLS policies for mm_agents table

-- Enable RLS on mm_agents table (if not already enabled)
ALTER TABLE mm_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Users can insert own mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Users can update own mm agents" ON mm_agents;
DROP POLICY IF EXISTS "Service role has full access to mm agents" ON mm_agents;

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role has full access to mm agents"
ON mm_agents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can view their own MM agents
CREATE POLICY "Users can view own mm agents"
ON mm_agents
FOR SELECT
TO authenticated
USING (wallet_address = auth.jwt()->>'wallet_address' OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Authenticated users can insert their own MM agents
CREATE POLICY "Users can insert own mm agents"
ON mm_agents
FOR INSERT
TO authenticated
WITH CHECK (wallet_address = auth.jwt()->>'wallet_address' OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Authenticated users can update their own MM agents
CREATE POLICY "Users can update own mm agents"
ON mm_agents
FOR UPDATE
TO authenticated
USING (wallet_address = auth.jwt()->>'wallet_address' OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub')
WITH CHECK (wallet_address = auth.jwt()->>'wallet_address' OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow anon users to interact (since API routes use service role)
CREATE POLICY "Anon users can interact with mm agents"
ON mm_agents
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
