-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_address TEXT NOT NULL,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on owner_address for faster queries
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON playlists(owner_address);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public playlists"
  ON playlists FOR SELECT
  USING (is_public = true OR owner_address = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can create their own playlists"
  ON playlists FOR INSERT
  WITH CHECK (owner_address = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can update their own playlists"
  ON playlists FOR UPDATE
  USING (owner_address = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can delete their own playlists"
  ON playlists FOR DELETE
  USING (owner_address = current_setting('request.jwt.claim.sub', true));
