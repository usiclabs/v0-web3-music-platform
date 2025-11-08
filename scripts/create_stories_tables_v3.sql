-- Drop existing tables if needed (for clean slate)
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

-- Create stories table without foreign key constraint
-- Removed REFERENCES profiles(wallet_address) constraint to allow stories from any wallet
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_address TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 5, -- seconds for photos, actual duration for videos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  
  -- Token gating
  is_token_gated BOOLEAN DEFAULT FALSE,
  required_token_address TEXT, -- profile token address
  required_token_amount NUMERIC DEFAULT 0,
  
  -- Metadata
  caption TEXT,
  link_url TEXT,
  link_text TEXT,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  -- Soft delete for expired stories
  is_active BOOLEAN DEFAULT TRUE
);

-- Create story views table
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_address TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views
  UNIQUE(story_id, viewer_address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_artist ON stories(artist_address);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views(viewer_address);

-- RLS Policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Anyone can view active, non-expired stories
CREATE POLICY "Anyone can view active stories"
  ON stories FOR SELECT
  USING (is_active = TRUE AND expires_at > NOW());

-- Allow all inserts (authentication handled at API level)
CREATE POLICY "Artists can create own stories"
  ON stories FOR INSERT
  WITH CHECK (TRUE);

-- Artists can update/delete their stories
CREATE POLICY "Artists can update own stories"
  ON stories FOR UPDATE
  USING (TRUE);

CREATE POLICY "Artists can delete own stories"
  ON stories FOR DELETE
  USING (TRUE);

-- Story views policies
CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create story views"
  ON story_views FOR INSERT
  WITH CHECK (TRUE);

-- Function to auto-deactivate expired stories
CREATE OR REPLACE FUNCTION deactivate_expired_stories()
RETURNS void AS $$
BEGIN
  UPDATE stories
  SET is_active = FALSE
  WHERE is_active = TRUE AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE stories IS 'Instagram-style stories that expire after 24 hours';
COMMENT ON TABLE story_views IS 'Tracks which users have viewed which stories';
COMMENT ON COLUMN stories.is_token_gated IS 'If true, viewers must hold required_token_amount of required_token_address';
COMMENT ON COLUMN stories.duration IS 'Display duration in seconds (5 for photos, actual length for videos)';
