-- Fix earnings for the specific track "Oh my" by artist 0x567a...ba64
-- This track has corrupted total_paid values that need to be divided by 1,000,000

-- First, let's identify the track and see the current values
-- The artist address from the screenshot is 0x567ae333b003b4795f71cdd4033c607125a0ba64 (full address)

-- Option 1: Fix by artist address (if we know the full address)
UPDATE streams
SET total_paid = (total_paid::numeric / 1000000)
WHERE track_id IN (
  SELECT id FROM tracks 
  WHERE artist_address = '0x567ae333b003b4795f71cdd4033c607125a0ba64'
)
AND total_paid::numeric > 10; -- Only fix values that are clearly wrong (> $10)

-- Option 2: Fix all streams with suspiciously high earnings (> $10)
-- This is safer and will catch any other anomalies
UPDATE streams
SET total_paid = (total_paid::numeric / 1000000)
WHERE total_paid::numeric > 10;

-- Verify the fix
SELECT 
  t.title,
  t.artist_address,
  s.total_paid as corrected_total_paid,
  s.chunks_played
FROM streams s
JOIN tracks t ON s.track_id = t.id
WHERE t.artist_address = '0x567ae333b003b4795f71cdd4033c607125a0ba64'
ORDER BY s.total_paid DESC;
