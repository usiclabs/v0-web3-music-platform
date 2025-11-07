-- Function to create notification for new follow
CREATE OR REPLACE FUNCTION notify_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_address, sender_address, type)
  VALUES (NEW.following_address, NEW.follower_address, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new follows
DROP TRIGGER IF EXISTS trigger_notify_new_follow ON follows;
CREATE TRIGGER trigger_notify_new_follow
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follow();

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
    INSERT INTO notifications (recipient_address, sender_address, type, track_id)
    VALUES (track_artist, NEW.user_address, 'like', NEW.track_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new likes
DROP TRIGGER IF EXISTS trigger_notify_new_like ON likes;
CREATE TRIGGER trigger_notify_new_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_new_like();

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
      INSERT INTO notifications (recipient_address, sender_address, type, track_id, comment_id, content)
      VALUES (parent_comment_author, NEW.user_address, 'reply', NEW.track_id, NEW.id, NEW.content);
    END IF;
  END IF;
  
  -- Notify the track artist (if not the commenter)
  IF track_artist IS NOT NULL AND track_artist != NEW.user_address THEN
    INSERT INTO notifications (recipient_address, sender_address, type, track_id, comment_id, content)
    VALUES (track_artist, NEW.user_address, 'comment', NEW.track_id, NEW.id, NEW.content);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new comments
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;
CREATE TRIGGER trigger_notify_new_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_new_comment();
