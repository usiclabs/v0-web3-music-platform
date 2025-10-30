-- Enable Realtime for notification tables
-- This script enables Supabase Realtime on the streams and swap_history tables
-- so that real-time toast notifications can work properly

-- Enable Realtime on the streams table (for song unlock notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE streams;

-- Enable Realtime on the swap_history table (for token purchase notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE swap_history;

-- Verify the tables are added to the publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
