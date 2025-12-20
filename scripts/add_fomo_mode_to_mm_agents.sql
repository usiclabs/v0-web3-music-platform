-- Add FOMO mode columns to mm_agents table if they don't exist
ALTER TABLE mm_agents
ADD COLUMN IF NOT EXISTS fomo_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fomo_intensity integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS fomo_pattern text DEFAULT 'cascade';

-- Add comment explaining the columns
COMMENT ON COLUMN mm_agents.fomo_mode IS 'Enable FOMO (Fear of Missing Out) trading mode';
COMMENT ON COLUMN mm_agents.fomo_intensity IS 'Intensity level of FOMO patterns (1-10, 10 being Apex Predator)';
COMMENT ON COLUMN mm_agents.fomo_pattern IS 'Type of FOMO pattern: cascade, pyramid, or apex_predator';

-- Enable update timestamp trigger if not already present
CREATE OR REPLACE FUNCTION update_mm_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mm_agents_updated_at_trigger ON mm_agents;

CREATE TRIGGER update_mm_agents_updated_at_trigger
BEFORE UPDATE ON mm_agents
FOR EACH ROW
EXECUTE FUNCTION update_mm_agents_updated_at();
