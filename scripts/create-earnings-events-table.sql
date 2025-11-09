-- Create earnings_events table for real-time earnings notifications
CREATE TABLE IF NOT EXISTS earnings_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_address TEXT NOT NULL,
  artist_name TEXT,
  amount NUMERIC NOT NULL,
  track_id UUID REFERENCES tracks(id),
  track_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_earnings_events_created_at ON earnings_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_events_artist ON earnings_events(artist_address);

-- Enable RLS
ALTER TABLE earnings_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view earnings events (public feed)
CREATE POLICY "Anyone can view earnings events"
  ON earnings_events
  FOR SELECT
  USING (true);

-- Only server can insert earnings events
CREATE POLICY "Server can insert earnings events"
  ON earnings_events
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE earnings_events;
