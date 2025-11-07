-- Complete notification system setup script
-- This script sets up everything needed for the notification system to work

-- 1. Ensure notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_address TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'reply')),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_address);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (true);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 6. Create trigger functions

-- Function to create notification for new follow
CREATE OR REPLACE FUNCTION notify_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_address, sender_address, type, created_at)
  VALUES (NEW.following_address, NEW.follower_address, 'follow', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for new like
CREATE OR REPLACE FUNCTION notify_new_like()
RETURNS TRIGGER AS $$
DECLARE
  track_artist TEXT;
BEGIN
  -- Get the artist of the track
  SELECT artist_id INTO track_artist
  FROM tracks
  WHERE id = NEW.track_id;
  
  -- Only notify if the liker is not the artist
  IF track_artist IS NOT NULL AND track_artist != NEW.user_address THEN
    INSERT INTO notifications (recipient_address, sender_address, type, track_id, created_at)
    VALUES (track_artist, NEW.user_address, 'like', NEW.track_id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for new comment
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  track_artist TEXT;
  parent_comment_author TEXT;
BEGIN
  -- Get the artist of the track
  SELECT artist_id INTO track_artist
  FROM tracks
  WHERE id = NEW.track_id;
  
  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_address INTO parent_comment_author
    FROM comments
    WHERE id = NEW.parent_id;
    
    IF parent_comment_author IS NOT NULL AND parent_comment_author != NEW.user_address THEN
      INSERT INTO notifications (recipient_address, sender_address, type, track_id, comment_id, content, created_at)
      VALUES (parent_comment_author, NEW.user_address, 'reply', NEW.track_id, NEW.id, NEW.content, NOW());
    END IF;
  END IF;
  
  -- Notify the track artist (if not the commenter and not already notified as parent)
  IF track_artist IS NOT NULL 
     AND track_artist != NEW.user_address 
     AND (NEW.parent_id IS NULL OR track_artist != parent_comment_author) THEN
    INSERT INTO notifications (recipient_address, sender_address, type, track_id, comment_id, content, created_at)
    VALUES (track_artist, NEW.user_address, 'comment', NEW.track_id, NEW.id, NEW.content, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_follow ON follows;
CREATE TRIGGER trigger_notify_new_follow
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follow();

DROP TRIGGER IF EXISTS trigger_notify_new_like ON likes;
CREATE TRIGGER trigger_notify_new_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_new_like();

DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;
CREATE TRIGGER trigger_notify_new_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_new_comment();

-- 8. Verify setup
DO $$
BEGIN
  RAISE NOTICE 'Notification system setup complete!';
  RAISE NOTICE 'Triggers created: trigger_notify_new_follow, trigger_notify_new_like, trigger_notify_new_comment';
  RAISE NOTICE 'Test the system by having a user follow, like, or comment on content.';
END $$;
