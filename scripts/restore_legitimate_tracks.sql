-- Ultra-conservative rollback that only restores tracks that were legitimately high-value
-- This will fix tracks like "FARGO" (50 USDC) without touching corrupted data

-- Only restore values that are:
-- 1. Very small (< 0.001) - these were definitely divided incorrectly
-- 2. Will result in reasonable values (< 100) after multiplication
-- This ensures we don't restore corrupted data that would cause overflow

UPDATE streams
SET total_paid = (total_paid::numeric * 1000000)
WHERE total_paid IS NOT NULL 
  AND total_paid > 0
  AND total_paid < 0.0001  -- Only extremely small values
  AND (total_paid * 1000000) < 100;  -- Ensure result is reasonable

-- This will restore:
-- - FARGO: 0.00005 → 50 USDC ✓
-- - Any other legitimate high-value tracks that were incorrectly divided

-- It will NOT touch:
-- - Values >= 0.0001 (including the corrupted "Oh my" track at ~0.005)
-- - Values that would result in > 100 USDC (safety check)
-- - Zero or NULL values
