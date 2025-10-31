-- Safe rollback script that only restores values that were incorrectly divided
-- This will fix tracks like "FARGO" that went from 50 USDC to 0.00005 USDC
-- while avoiding numeric overflow errors

-- Only rollback values that are very small (< 1 USDC)
-- These are the ones that were incorrectly divided by 1,000,000
UPDATE streams
SET total_paid = (total_paid::numeric * 1000000)
WHERE total_paid IS NOT NULL 
  AND total_paid < 1
  AND total_paid > 0;

-- This will restore:
-- - FARGO: 0.00005 → 50 USDC ✓
-- - Any other tracks that were incorrectly divided

-- It will NOT touch:
-- - Values >= 1 (to avoid overflow)
-- - Zero values
-- - NULL values
