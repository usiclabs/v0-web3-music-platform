-- Drop the existing foreign key constraint on stories table
-- This allows any wallet address to create stories without needing a profile first

ALTER TABLE stories 
DROP CONSTRAINT IF EXISTS stories_artist_address_fkey;

-- Verify the constraint is removed
-- Now stories.artist_address is just a text field without foreign key validation
