-- Manual fix for specific tracks that were incorrectly divided
-- This avoids numeric overflow by using explicit values

-- Fix FARGO track (50 USDC unlock, currently showing 0.0001)
-- Find and fix by track title and artist
UPDATE streams s
SET total_paid = 50.0
FROM tracks t
WHERE s.track_id = t.id
  AND t.title = 'FARGO'
  AND s.total_paid < 0.001
  AND s.total_paid > 0;

-- If there are other tracks that need fixing, add them here
-- Example:
-- UPDATE streams s
-- SET total_paid = [correct_value]
-- FROM tracks t
-- WHERE s.track_id = t.id
--   AND t.title = '[track_name]'
--   AND s.total_paid < 0.001;

-- Verify the fix
SELECT t.title, t.artist_address, s.total_paid
FROM streams s
JOIN tracks t ON s.track_id = t.id
WHERE t.title = 'FARGO'
LIMIT 5;
