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

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.jwt() ->> 'sub' = recipient_address OR recipient_address = current_setting('request.jwt.claim.sub', true));

-- Anyone can create notifications (needed for triggers)
CREATE POLICY "Anyone can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.jwt() ->> 'sub' = recipient_address OR recipient_address = current_setting('request.jwt.claim.sub', true));

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.jwt() ->> 'sub' = recipient_address OR recipient_address = current_setting('request.jwt.claim.sub', true));
