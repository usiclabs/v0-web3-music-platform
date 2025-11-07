-- Create agent feedback table for ERC-8004 reputation tracking
CREATE TABLE IF NOT EXISTS agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_address TEXT NOT NULL,
  user_address TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent ON agent_feedback(agent_address);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_user ON agent_feedback(user_address);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_playlist ON agent_feedback(playlist_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_created ON agent_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view feedback"
  ON agent_feedback
  FOR SELECT
  USING (true);

CREATE POLICY "Users can submit feedback"
  ON agent_feedback
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_feedback;
