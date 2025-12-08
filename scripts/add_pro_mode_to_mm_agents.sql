-- Add pro_mode column to mm_agents table
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS pro_mode BOOLEAN DEFAULT false;

-- Update existing agents to have pro_mode = false
UPDATE mm_agents SET pro_mode = false WHERE pro_mode IS NULL;
