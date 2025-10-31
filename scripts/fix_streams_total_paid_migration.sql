-- Migration: Convert total_paid from base units to decimal USDC
-- This fixes the issue where total_paid was stored in base units (e.g., 5000)
-- instead of decimal USDC (e.g., 0.005)

-- Update all streams to convert total_paid from base units to decimal
-- USDC has 6 decimals, so we divide by 1,000,000
UPDATE streams
SET total_paid = total_paid / 1000000
WHERE total_paid > 10;  -- Only update values that are clearly in base units (> 10 USDC is suspicious)

-- Add a comment to document the column format
COMMENT ON COLUMN streams.total_paid IS 'Total amount paid in decimal USDC (e.g., 0.005 for 5000 base units)';
