-- Create mm_agent_activity table for logging MM agent activities
CREATE TABLE IF NOT EXISTS mm_agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES mm_agents(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mm_agent_activity_agent_id ON mm_agent_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_mm_agent_activity_created_at ON mm_agent_activity(created_at DESC);

-- Enable RLS
ALTER TABLE mm_agent_activity ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view activity
CREATE POLICY "Anyone can view MM activity"
  ON mm_agent_activity
  FOR SELECT
  USING (true);

-- Allow service role to insert activity
CREATE POLICY "Service role can log MM activity"
  ON mm_agent_activity
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE mm_agent_activity;
