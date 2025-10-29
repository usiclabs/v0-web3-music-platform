-- Add 'token' as an allowed unlock_type value
-- This allows tokenized songs to be created with unlock_type = 'token'

ALTER TABLE tracks
DROP CONSTRAINT IF EXISTS tracks_unlock_type_check;

ALTER TABLE tracks
ADD CONSTRAINT tracks_unlock_type_check 
CHECK (unlock_type IN ('per_chunk', 'full_song', 'token'));

-- Update any existing tracks with coin_address or nft_contract_address to use 'token' unlock_type
UPDATE tracks 
SET unlock_type = 'token' 
WHERE (coin_address IS NOT NULL OR nft_contract_address IS NOT NULL) 
AND unlock_type != 'token';
