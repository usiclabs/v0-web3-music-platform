-- Add profitable_mode column to mm_agents table
ALTER TABLE mm_agents ADD COLUMN IF NOT EXISTS profitable_mode BOOLEAN DEFAULT false;

-- Add profit tracking to mm_agent_wallets table
ALTER TABLE mm_agent_wallets ADD COLUMN IF NOT EXISTS last_buy_price NUMERIC DEFAULT 0;
ALTER TABLE mm_agent_wallets ADD COLUMN IF NOT EXISTS last_buy_amount NUMERIC DEFAULT 0;

-- Update existing agents to have profitable_mode = false
UPDATE mm_agents SET profitable_mode = false WHERE profitable_mode IS NULL;
