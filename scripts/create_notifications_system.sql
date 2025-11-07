-- Create notifications table for follows, comments, and likes
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_address TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'reply')),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_address);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create user presence table for tracking online status
CREATE TABLE IF NOT EXISTS user_presence (
  user_address TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'listening', 'streaming')),
  current_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  current_stream_id TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster presence queries
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at DESC);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies (fully permissive)
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
CREATE POLICY "Allow all operations on notifications"
ON notifications FOR ALL
USING (true)
WITH CHECK (true);

-- User Presence RLS Policies (fully permissive for all operations)
DROP POLICY IF EXISTS "Allow all operations on user_presence" ON user_presence;
CREATE POLICY "Allow all operations on user_presence"
ON user_presence FOR ALL
USING (true)
WITH CHECK (true);

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable Realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
