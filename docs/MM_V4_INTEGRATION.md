# Uniswap V4 Market Maker Integration

## Overview
This extension adds Uniswap V4 pool support to the Market Maker (`/mm`) feature, enabling users to run market-making operations on tokens with Uniswap V4 liquidity pools.

## Features

### 1. **Pool Detection**
- Automatically detects Uniswap V4 pools for configured tokens
- Analyzes pool liquidity, fees, and hooks
- Shows pool characteristics and performance metrics
- Component: `MMV4PoolDetector`

### 2. **Pool-Specific Operations**
- Execute swaps directly on V4 pools
- Manage liquidity positions with concentrated liquidity ranges
- Support for custom hooks and fee tiers
- Real-time pool state monitoring
- Component: `MMV4SwapPanel`

### 3. **Swap History & Analytics**
- Track all V4 swaps with full execution details
- Monitor profit/loss on each trade
- View success rates and performance metrics
- Historical data persistence
- Component: `MMV4SwapHistory`

### 4. **Advanced Features**
- Multi-pool strategies
- Hook integration for custom swap logic
- Liquidity concentration management
- Slippage protection and price impact analysis

## Architecture

### Database Schema
Three main tables track V4 operations:

**`mm_v4_pools`** - Active pools for each agent
- Pool configuration (tokens, fees, hooks)
- Liquidity balance tracking
- Performance metrics

**`mm_v4_swaps`** - Individual swap executions
- Swap direction and amounts
- Price impact and profit/loss
- Transaction confirmation status

**`mm_v4_liquidity_positions`** - Concentrated liquidity positions
- Position tick ranges
- Liquidity amounts
- Status tracking

### Services

**`MarketMakerAgentV4`** (`lib/agents/market-maker-agent-v4.ts`)
- Main MM engine for V4 pools
- Strategy execution and optimization
- Multi-pool coordination

**`PoolDetectionService`** (`lib/agents/pool-detection-service.ts`)
- Detects V4 and V3 pools
- Analyzes pool characteristics
- Routes to appropriate handler

### API Endpoints

**Pool Detection**: `/api/agents/mm/v4-support/detect-pool`
- Input: Token address, MM agent config
- Output: Available V4 pools with metadata

**Execute Swap**: `/api/agents/mm/v4-support/swap`
- Input: Pool key, swap direction, amount
- Output: Transaction hash and expected output

**Fetch Pools**: `/api/agents/mm/v4-support/pools?agent_id=...`
- Lists active V4 pools for agent
- Includes performance stats

**Swap History**: `/api/agents/mm/v4-support/history?agent_id=...&limit=50`
- Historical swap data with P&L
- Success rates and metrics

## Integration with Existing MM

The V4 extension:
- Uses same agent infrastructure as V2/V3
- Shares wallet management and smart accounts
- Compatible with existing MM strategies
- Auto-detects pool version and routes appropriately

## Setup Instructions

1. **Execute Migration Script**
   \`\`\`sql
   -- Run: scripts/03-create-mm-v4-tables.sql
   -- Creates V4 pool tracking tables with RLS policies
   \`\`\`

2. **Deploy V4 Components**
   - Pool detector automatically enabled
   - Swap panel available once V4 pool detected
   - History tracking happens automatically

3. **Configure MM Agent**
   - Select token address
   - V4 pools auto-detected on dashboard
   - Enable V4 trading in agent config

## Security Considerations

### Smart Contract Safety
- Uses official Uniswap V4 core contracts
- Validated hook addresses before execution
- Slippage protection on all swaps
- Atomic transactions for liquidity operations

### User Fund Protection
- Private keys never leave user's wallet
- All transactions require explicit approval
- Maximum slippage limits enforced
- Transaction preview before execution

### RLS Policies
- Users can only access their own pools/swaps
- Admin operations require special permissions
- Database auditing on all transactions

## Performance Optimization

- Pool data cached with 5-minute TTL
- Swap history indexed by agent and status
- Batch operations for multiple pools
- Real-time updates via WebSocket (optional)

## Testing

Test V4 integration with:
1. Small amounts on mainnet
2. Full pool detection workflow
3. Multi-pool swap scenarios
4. Hook compatibility validation

## Future Enhancements

- V4 hook creation wizard
- Advanced liquidity concentration strategies
- Cross-pool arbitrage detection
- Automated rebalancing
- Position management UI improvements

## Support & Troubleshooting

**Pool Not Detected**: Ensure token has active V4 pool on Base network
**Swap Failing**: Check slippage tolerance and pool liquidity
**Hook Issues**: Verify hook contract is compatible with V4 core

## References

- [Uniswap V4 Docs](https://docs.uniswap.org/contracts/v4/overview)
- [V4 Swap Implementation](https://docs.uniswap.org/contracts/v4/quickstart/swap)
- [V4 Hooks Guide](https://docs.uniswap.org/contracts/v4/quickstart/hooks/swap)
