-- Create livestream_comments table for real-time chat during live streams
CREATE TABLE IF NOT EXISTS public.livestream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_livestream_comments_stream_id ON livestream_comments(stream_id);
CREATE INDEX IF NOT EXISTS idx_livestream_comments_created_at ON livestream_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE livestream_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view livestream comments"
  ON livestream_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON livestream_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own comments"
  ON livestream_comments FOR DELETE
  USING (user_address = current_setting('request.jwt.claims', true)::json->>'sub');
