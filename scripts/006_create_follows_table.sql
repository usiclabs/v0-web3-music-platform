-- Create follows table for tracking follower/following relationships
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_address TEXT NOT NULL,
  following_address TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate follows
  UNIQUE(follower_address, following_address),
  
  -- Prevent self-follows
  CHECK (follower_address != following_address)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_address);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_address);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

-- RLS Policies
-- Allow anyone to read follows (public data)
CREATE POLICY "Anyone can view follows"
  ON public.follows
  FOR SELECT
  USING (true);

-- Allow authenticated users to follow others
CREATE POLICY "Users can follow others"
  ON public.follows
  FOR INSERT
  WITH CHECK (true);

-- Allow users to unfollow
CREATE POLICY "Users can unfollow"
  ON public.follows
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
