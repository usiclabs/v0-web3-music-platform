-- Create reports table for content flagging
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  reporter_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_track_id ON reports(track_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_address);

-- Add RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create reports
CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read their own reports
CREATE POLICY "Users can read their own reports" ON reports
  FOR SELECT
  USING (reporter_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Allow admins to read all reports (will be enforced in API)
CREATE POLICY "Allow read access to reports" ON reports
  FOR SELECT
  USING (true);
