-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_address, track_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_likes_user_address ON likes(user_address);
CREATE INDEX IF NOT EXISTS idx_likes_track_id ON likes(track_id);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

-- Allow users to insert their own likes
CREATE POLICY "Users can like tracks" ON likes
  FOR INSERT WITH CHECK (true);

-- Allow users to delete their own likes
CREATE POLICY "Users can unlike tracks" ON likes
  FOR DELETE USING (true);
