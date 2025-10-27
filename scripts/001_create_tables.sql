-- Profiles table (wallet-based, no email/password auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  wallet_address TEXT PRIMARY KEY,
  artist_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration INTEGER NOT NULL,
  price_per_chunk DECIMAL(10,6) DEFAULT 0.005,
  nft_contract_address TEXT,
  token_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Royalty splits table
CREATE TABLE IF NOT EXISTS public.royalty_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  recipient_address TEXT NOT NULL,
  share_percentage INTEGER NOT NULL CHECK (share_percentage > 0 AND share_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streams table (analytics)
CREATE TABLE IF NOT EXISTS public.streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  listener_address TEXT NOT NULL,
  chunks_played INTEGER DEFAULT 0,
  total_paid DECIMAL(10,6) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_track_id ON public.royalty_splits(track_id);
CREATE INDEX IF NOT EXISTS idx_streams_track_id ON public.streams(track_id);
CREATE INDEX IF NOT EXISTS idx_streams_listener_address ON public.streams(listener_address);
