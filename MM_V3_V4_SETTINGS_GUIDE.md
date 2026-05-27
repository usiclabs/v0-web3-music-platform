# Uniswap V3/V4 Pool Selection in Market Maker Settings

## Overview

The Market Maker dashboard at `/dashboard/agent/mm` now includes a complete V3/V4 pool version selector in the Agent Configuration modal. This allows musicians to choose which Uniswap pool version their market maker should use for trading.

## Implementation Details

### Database Schema
- **Table**: `mm_agents`
- **New Column**: `uniswap_version`
- **Type**: VARCHAR(3) with CHECK constraint (v3 or v4)
- **Default**: v3
- **Migration**: `/supabase/migrations/add_uniswap_version_to_mm_agents.sql`

### Frontend Implementation

#### State Management
```typescript
const [uniswapVersion, setUniswapVersion] = useState<"v3" | "v4">("v3")
```

#### Config Loading
When the config is loaded from the API, the `uniswapVersion` is automatically set:
```typescript
useEffect(() => {
  if (configData?.config) {
    setConfig(configData.config)
    setUniswapVersion((configData.config as any).uniswap_version || "v3")
  }
}, [configData])
```

#### Settings Modal UI
Located at lines 1664-1725 in `/app/dashboard/agent/mm/page.tsx`

Two-button selector with visual feedback:
- **V3 Button**: Emerald border and background when selected
  - Label: "Uniswap V3"
  - Description: "Concentrated liquidity pools"
  - Ideal for: Capital-efficient trading with fixed fees

- **V4 Button**: Blue border and background when selected
  - Label: "Uniswap V4"
  - Description: "PoolManager with hooks support"
  - Ideal for: Custom hook support and dynamic fees

#### Saving Configuration
When user clicks a version button:
1. Local state updates immediately (`setUniswapVersion`)
2. API call sends update: `PUT /api/agents/mm/config`
3. Toast notification confirms selection
4. SWR mutation refreshes config data

### API Integration

#### PUT Endpoint: `/api/agents/mm/config`
Accepts `uniswap_version` in the request body:
```json
{
  "agentId": "uuid",
  "uniswap_version": "v3" | "v4"
}
```

The API automatically persists this to the database via Supabase update.

### Integration with Swap Panel

The selected Uniswap version automatically flows to the swap panel component:
```typescript
<MMUnifiedSwapPanel
  agentId={config.id}
  ownerAddress={config.owner_address || address || ""}
  tokenAddress={config.token_address}
  walletIndex={1}
  defaultVersion={uniswapVersion}  // Uses selected version
/>
```

The unified swap panel then:
- Displays which version is active
- Shows version-specific information
- Routes swap requests to the correct API endpoint
- Displays appropriate pool detection UI

### Swap Execution Routing

Based on the selected version, swaps are routed to:
- **V3**: `/api/agents/mm/v3-swap/route.ts` - Uses Uniswap V3 Router
- **V4**: `/api/agents/mm/v4-support/swap/route.ts` - Uses Uniswap V4 PoolManager

## User Flow

1. **Access Settings**: Click Settings button in MM dashboard
2. **View Pool Options**: See two pool version buttons
3. **Select Version**: Click V3 or V4 button
4. **Confirm**: Toast notification shows selection was saved
5. **Swap Operations**: All manual swaps and automated trades use selected version
6. **Change Anytime**: User can switch versions anytime by reopening settings

## Version Differences

### Uniswap V3
- Fixed fee tiers (0.01%, 0.05%, 0.3%, 1%)
- Concentrated liquidity via tick ranges
- Proven track record and high liquidity
- Lower complexity for market makers
- Standard pool operations

### Uniswap V4
- Custom dynamic fees via hooks
- Singleton PoolManager architecture
- ERC-6909 token accounting
- Support for custom hooks and extensions
- More complex but more flexible

## Database Migration

The migration file creates the new column with proper constraints:
- ADD COLUMN with DEFAULT 'v3'
- CHECK constraint to validate values
- Index for faster lookups
- Column documentation

To apply the migration, the system will automatically run migrations or you can manually execute the SQL.

## Error Handling

- If API call fails: Toast error "Failed to update Uniswap version"
- If config load fails: Defaults to V3
- Invalid values are rejected by database CHECK constraint
- Network errors are caught and logged

## Features Enabled by This Configuration

1. **Version-Specific Swap Routing**: Swaps automatically route to correct protocol
2. **Pool Detection**: Shows appropriate pools for selected version
3. **Fee Structure Display**: Shows fees based on selected protocol version
4. **Hooks Support**: V4 selection enables hook information display
5. **Future Extensions**: Foundation for version-specific strategies and settings
