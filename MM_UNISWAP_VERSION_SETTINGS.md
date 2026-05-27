# Uniswap V3/V4 Pool Version Settings for Market Maker

## Overview
The `/dashboard/agent/mm` settings modal now supports configuring which Uniswap pool version (V3 or V4) the market maker should use for executing swaps.

## Features Implemented

### 1. Settings Modal Configuration
Located in the "Agent Configuration" dialog at `/dashboard/agent/mm`:

**Pool Version Selection:**
- **Uniswap V3**: Uses concentrated liquidity pools with fixed fee tiers (0.01%, 0.05%, 0.3%, 1%)
  - Best for: Stable, predictable market making with well-established pools
- **Uniswap V4**: Uses PoolManager with custom hooks, dynamic fees, and ERC-6909 accounting
  - Best for: Advanced features, custom hooks, and new liquidity mechanisms

### 2. Configuration Flow
1. Open MM Agent Dashboard
2. Click "Settings" button (gear icon)
3. Scroll to "Uniswap Pool Version" section
4. Select either "V3" or "V4"
5. Selection is automatically saved to your agent configuration
6. Confirmation toast shows the selected version

### 3. Active Version Display
The dashboard shows which version is currently active:
- **V3 Active** (emerald badge): Using Uniswap V3 pools
- **V4 Active** (blue badge): Using Uniswap V4 pools

### 4. Integration with Unified Swap Panel
The selected version automatically applies to:
- Manual swap testing in the "Uniswap Pools" section
- Pool detection logic
- Swap execution endpoints
- Transaction confirmation displays

## Technical Details

### Frontend State Management
```typescript
const [uniswapVersion, setUniswapVersion] = useState<"v3" | "v4">("v3")
```

### Configuration Persistence
- Saved to `mm_agents` table with field `uniswap_version`
- Loaded on dashboard initialization
- Passed to swap components as `defaultVersion` prop

### API Endpoints
- **GET** `/api/agents/mm/config` - Retrieves saved version preference
- **PUT** `/api/agents/mm/config` - Saves version preference (generic field support)

### Swap Execution
- V3 Swaps: `/api/agents/mm/v3-swap`
- V4 Swaps: `/api/agents/mm/v4-support/swap`
- Version selection determined by agent configuration

## User Benefits

✓ **Flexibility**: Choose the best pool version for your trading strategy
✓ **Automatic**: Once set, all swaps use your preferred version
✓ **Visible**: Always know which version is active via badge
✓ **Testable**: Manual swap panel respects your version preference
✓ **Switchable**: Change versions anytime in settings

## Future Enhancements

- Multi-version support (use V3 and V4 simultaneously for different tokens)
- Automatic version selection based on liquidity analysis
- Version-specific performance analytics
- A/B testing different versions per wallet
