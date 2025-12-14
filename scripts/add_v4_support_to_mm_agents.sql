-- Add V4 preference column to MM agents table
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS prefer_uniswap_v4 BOOLEAN DEFAULT FALSE;

-- Add index for V4 preference queries
CREATE INDEX IF NOT EXISTS idx_mm_agents_v4_preference ON mm_agents(prefer_uniswap_v4, is_active);

-- Update existing agents to have V4 preference set (default to V3)
UPDATE mm_agents SET prefer_uniswap_v4 = FALSE WHERE prefer_uniswap_v4 IS NULL;
