-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Enable RLS on playlists
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public playlists
CREATE POLICY "Anyone can view public playlists"
  ON playlists
  FOR SELECT
  USING (is_public = true OR LOWER(owner_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Policy: Users can create their own playlists
CREATE POLICY "Users can create their own playlists"
  ON playlists
  FOR INSERT
  WITH CHECK (LOWER(owner_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Policy: Users can update their own playlists
CREATE POLICY "Users can update their own playlists"
  ON playlists
  FOR UPDATE
  USING (LOWER(owner_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Policy: Users can delete their own playlists
CREATE POLICY "Users can delete their own playlists"
  ON playlists
  FOR DELETE
  USING (LOWER(owner_address) = LOWER(auth.jwt() ->> 'wallet_address'));

-- Enable RLS on playlist_tracks
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view tracks in public playlists
CREATE POLICY "Anyone can view tracks in public playlists"
  ON playlist_tracks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (playlists.is_public = true OR LOWER(playlists.owner_address) = LOWER(auth.jwt() ->> 'wallet_address'))
    )
  );

-- Policy: Playlist owners can add tracks
CREATE POLICY "Playlist owners can add tracks"
  ON playlist_tracks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND LOWER(playlists.owner_address) = LOWER(auth.jwt() ->> 'wallet_address')
    )
  );

-- Policy: Playlist owners can remove tracks
CREATE POLICY "Playlist owners can remove tracks"
  ON playlist_tracks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND LOWER(playlists.owner_address) = LOWER(auth.jwt() ->> 'wallet_address')
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON playlists(owner_address);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
