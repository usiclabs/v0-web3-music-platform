-- Rollback the incorrect migration that divided total_paid values
-- This restores values that were incorrectly divided by 1,000,000

-- Multiply back by 1,000,000 to restore original values
UPDATE streams
SET total_paid = (total_paid::numeric * 1000000)
WHERE total_paid IS NOT NULL 
  AND total_paid != '0'
  AND total_paid < 100; -- Only restore values that were likely affected by the migration

-- Log the changes
SELECT 
  track_id,
  listener_address,
  total_paid as restored_value,
  chunks_played
FROM streams
WHERE total_paid IS NOT NULL
ORDER BY total_paid DESC
LIMIT 20;
