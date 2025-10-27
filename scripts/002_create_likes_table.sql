-- Create likes table for tracking user likes on tracks
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate likes from the same user on the same track
  UNIQUE(user_address, track_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_likes_track_id ON public.likes(track_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_address ON public.likes(user_address);

-- Enable Row Level Security
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read likes (public data)
CREATE POLICY "Anyone can view likes"
  ON public.likes
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own likes
CREATE POLICY "Users can like tracks"
  ON public.likes
  FOR INSERT
  WITH CHECK (true);

-- Allow users to delete their own likes
CREATE POLICY "Users can unlike tracks"
  ON public.likes
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
