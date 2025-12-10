-- Add max_mode column to mm_agents table
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS max_mode BOOLEAN DEFAULT FALSE;

-- Update existing agents to set max_mode to false
UPDATE mm_agents SET max_mode = FALSE WHERE max_mode IS NULL;
