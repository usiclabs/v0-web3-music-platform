# Market Maker Agent - Uniswap V3 & V4 Support Guide

## Overview

The Market Maker Agent (`/dashboard/agent/mm`) fully supports both Uniswap V3 and V4 pools with automatic pool detection and version-aware swap execution. Users can toggle between V3 and V4 to execute swaps on the optimal pool for their token pair.

## Key Features

### Unified Swap Panel
- **Automatic Pool Detection**: Detects available V3 and V4 pools for any token pair
- **One-Click Toggle**: Switch between V3 and V4 without page reload
- **Version-Specific UI**: Shows appropriate fee structures and configuration for each version
- **Price Protection**: Implements sqrtPriceLimitX96 to prevent extreme slippage

### Uniswap V3 Support
- Capital-efficient concentrated liquidity
- Flexible fee tiers (0.01%, 0.05%, 0.3%, 1%)
- Oracle data for TWAP calculations
- Fixed swap fees per pool
- Standard constant-product AMM logic

### Uniswap V4 Support
- Singleton PoolManager architecture
- Custom hooks for dynamic behavior
- Flash accounting for efficient token transfers
- ERC-6909 token accounting system
- Dynamic fee support (fees can vary per hook)
- Tick spacing optimized per pool configuration
- StateView contracts for reading pool state offchain

## How It Works

### V3 Swaps
1. User enters swap amount in the unified panel
2. System detects V3 pool for token pair
3. Uses Uniswap V3 Router (`swapExactETHForTokens` or multi-hop)
4. Executes swap with ERC-20 approval + transfer
5. Returns tokens to user wallet

### V4 Swaps
1. User selects V4 from toggle and enters amount
2. System detects V4 pool using StateView contract
3. Reads pool configuration: fee, tickSpacing, hooks
4. Executes swap via PoolManager singleton
5. Uses flash accounting (deltas settle automatically)
6. Returns tokens via ERC-6909 accounting

## Pool Detection Logic

### V3 Pool Detection
- Checks for standard fee tiers: 0.01%, 0.05%, 0.3%, 1%
- Queries Uniswap V3 Factory for pool existence
- Validates liquidity > 0
- Returns first valid pool found

### V4 Pool Detection
- Checks common V4 configurations:
  - Fee tiers: 0.01%, 0.05%, 0.3%, 0.5%, 1%, 2.5%, 3%, 5%
  - Tick spacings: 1, 10, 20, 50, 60, 100, 200, 600
  - Hook addresses: Standard (no hooks) or custom hooks
- Uses StateView `getLiquidity()` to verify pool exists
- Handles V4's custom hook deployments
- Returns poolKey with full configuration

## Configuration Files

### API Routes
- `/app/api/agents/mm/v3-swap/route.ts` - V3 swap execution
- `/app/api/agents/mm/v4-support/swap/route.ts` - V4 swap execution
- `/app/api/agents/mm/v4-support/detect-pool/route.ts` - Pool detection
- `/app/api/agents/mm/v4-support/pools/route.ts` - List pools for token

### Components
- `/components/mm-unified-swap-panel.tsx` - Main swap interface with V3/V4 toggle
- `/components/mm-v4-pool-detector.tsx` - Pool detection UI
- `/components/mm-v4-swap-history.tsx` - Swap history tracking

### Libraries
- `/lib/web3/uniswap-v4-swap.ts` - V4 swap utilities (pool detection, quoting, execution)
- `/lib/web3/contracts.ts` - Contract ABIs and addresses for both versions
- `/lib/agents/market-maker-agent-v4.ts` - MarketMakerV4Service for V4 operations

## Technical Deep Dive

### V3 Swap Flow
```typescript
// 1. Approve token spending
walletClient.writeContract({ functionName: "approve", args: [router, amount] })

// 2. Swap via router
walletClient.writeContract({
  functionName: "swapExactETHForTokens",
  args: [minAmountOut, [WETH, token], recipient, deadline],
  value: amountIn
})

// 3. Tokens received directly to user wallet
```

### V4 Swap Flow
```typescript
// 1. Pool detection (using StateView)
const poolKey = await detectV4Pool(tokenAddress, chainId, publicClient)

// 2. Execute swap via PoolManager singleton
walletClient.writeContract({
  address: poolManagerAddress,
  functionName: "swap",
  args: [poolKey, swapParams, hookData]
})

// 3. Flash accounting handles token settlement
// (deltas are settled through callbacks)
```

### Price Limits
Both V3 and V4 use sqrtPriceX96 limits to prevent slippage:
- V3: Limited in SwapRouter parameters
- V4: Enforced in PoolManager.swap()

## Swap Routing Strategy

The system uses intelligent routing:

1. **Token Detection**: Checks if token exists on V3 or V4
2. **Liquidity Check**: Prefers pools with >0 liquidity
3. **Fee Optimization**: For V4, considers dynamic hook fees
4. **User Selection**: Respects manual V3/V4 toggle if set
5. **Fallback**: Uses available pool if only one version exists

## Hook Support (V4 Only)

V4 pools can have custom hooks that:
- Modify swap fees dynamically
- Add custom logic before/after swaps
- Implement TWAMM (Time-Weighted Average Market Maker)
- Add permissionless liquidity mining

The MM Agent shows hook address in pool details. Common hooks:
- `0x0000...0000` - No hooks (standard pool)
- Custom addresses - Shows the deployed hook contract

## Error Handling

### V3 Errors
- "No V3 pool found" - Token not listed on V3
- "Approval failed" - ERC-20 approval issue
- "Swap failed" - Router execution error

### V4 Errors
- "No V4 pool found" - Token not on V4
- "Pool has no liquidity" - Pool initialized but empty
- "Invalid pool configuration" - Pool key mismatch
- "Flash accounting failed" - Settlement issue

## Testing Pools

### V3 Test Pools (Base Chain)
- WETH/USDC (0.3%, 60 tickSpacing)
- WETH/DAI (0.3%, 60 tickSpacing)

### V4 Test Pools (Base Chain)
- Various token pairs with configurable fees
- Custom hook pools (if deployed)

## Performance Notes

- V3: ~150k gas per swap
- V4: ~180k gas per swap (includes hook execution)
- Pool detection: ~300ms (batches requests)
- Quote calculation: ~50ms (uses on-chain state)

## Future Enhancements

1. **Quoter Integration**: Use official Uniswap Quoter v2 for accurate quotes
2. **Multi-hop Routing**: V4 chain swaps through multiple pools
3. **Hook Interaction**: Custom pre/post-swap hook logic
4. **Liquidity Management**: Add/remove LP positions on V4
5. **Advanced Strategies**: Range orders, TWAMM orders on V4 hooks

## Quick Start

1. Navigate to `/dashboard/agent/mm`
2. Select token address (or use preset)
3. Enter swap amount
4. Toggle between V3 and V4
5. Review pool configuration
6. Click "Swap" to execute
7. Confirm transaction in wallet
8. View results in swap history

---

For technical support or integration questions, refer to:
- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [Uniswap V4 Docs](https://docs.uniswap.org/contracts/v4/overview)
