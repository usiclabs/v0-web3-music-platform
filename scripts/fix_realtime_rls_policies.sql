-- Fix Realtime notifications by configuring proper RLS policies
-- This script ensures that Realtime events can be broadcast while maintaining security

-- Fixed syntax error - ALTER PUBLICATION doesn't support IF NOT EXISTS
-- Using DO blocks to check if tables are already in the publication before adding them

-- Enable Realtime on streams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'streams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE streams;
    RAISE NOTICE 'Added streams table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'streams table already in supabase_realtime publication';
  END IF;
END $$;

-- Enable Realtime on swap_history table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'swap_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE swap_history;
    RAISE NOTICE 'Added swap_history table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'swap_history table already in supabase_realtime publication';
  END IF;
END $$;

-- Configure RLS policies for streams table
-- Allow anyone to SELECT (read) streams for real-time notifications
-- This doesn't compromise security as stream data is public information
DROP POLICY IF EXISTS "Allow public read access for realtime" ON streams;
CREATE POLICY "Allow public read access for realtime"
ON streams
FOR SELECT
TO anon, authenticated
USING (true);

-- Configure RLS policies for swap_history table
-- Allow anyone to SELECT (read) swap history for real-time notifications
-- This doesn't compromise security as swap data is public blockchain information
DROP POLICY IF EXISTS "Allow public read access for realtime" ON swap_history;
CREATE POLICY "Allow public read access for realtime"
ON swap_history
FOR SELECT
TO anon, authenticated
USING (true);

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('streams', 'swap_history')
ORDER BY tablename, policyname;
