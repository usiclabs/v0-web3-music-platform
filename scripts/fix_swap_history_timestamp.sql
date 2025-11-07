-- Fix swap_history.created_at column to use timestamp with time zone
-- This ensures timestamps are correctly stored with timezone info and display accurately

-- Convert existing timestamps to timestamptz (assumes they are in UTC)
ALTER TABLE swap_history 
ALTER COLUMN created_at TYPE timestamp with time zone 
USING created_at AT TIME ZONE 'UTC';

-- Add comment for documentation
COMMENT ON COLUMN swap_history.created_at IS 'Timestamp when the swap occurred (with timezone)';
