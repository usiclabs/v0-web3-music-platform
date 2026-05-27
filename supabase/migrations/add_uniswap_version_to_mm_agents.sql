-- Add uniswap_version column to mm_agents table
-- This column stores the preferred Uniswap pool version (v3 or v4) for market making

ALTER TABLE public.mm_agents
ADD COLUMN IF NOT EXISTS uniswap_version VARCHAR(3) DEFAULT 'v3' CHECK (uniswap_version IN ('v3', 'v4'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mm_agents_uniswap_version ON public.mm_agents(uniswap_version);

-- Add comment to document the column
COMMENT ON COLUMN public.mm_agents.uniswap_version IS 'Preferred Uniswap pool version for market making (v3 or v4)';
