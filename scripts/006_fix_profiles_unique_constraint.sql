-- Fix duplicate profiles by adding unique constraint on wallet_address
-- This migration will:
-- 1. Remove duplicate profiles (keeping the one with avatar_url, or most recent if none have avatar)
-- 2. Add a case-insensitive unique constraint on wallet_address to prevent future duplicates

-- Step 1: Delete duplicate profiles (case-insensitive duplicates)
-- Keep the one with avatar_url, or most recent if none have avatar
WITH ranked_profiles AS (
  SELECT 
    wallet_address,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(wallet_address)
      ORDER BY 
        -- Prioritize profiles with avatar_url (non-null values come first)
        CASE WHEN avatar_url IS NOT NULL THEN 0 ELSE 1 END,
        -- Then by most recent created_at
        created_at DESC
    ) as rn
  FROM profiles
)
DELETE FROM profiles
WHERE wallet_address IN (
  SELECT wallet_address 
  FROM ranked_profiles 
  WHERE rn > 1
);

-- Step 2: Add unique constraint on wallet_address (case-insensitive)
-- Drop existing index if it exists
DROP INDEX IF EXISTS profiles_wallet_address_lower_unique;

-- Create a unique index on lowercase wallet_address for case-insensitive uniqueness
CREATE UNIQUE INDEX profiles_wallet_address_lower_unique 
ON profiles(LOWER(wallet_address));

-- Step 3: Create an index on wallet_address for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);

-- Step 4: Add a comment to document the constraint
COMMENT ON INDEX profiles_wallet_address_lower_unique IS 'Ensures each wallet address can only have one profile (case-insensitive)';
