/**
 * Uniswap v4 Contract Addresses and ABIs
 *
 * Note: Uniswap v4 uses CREATE2 for deterministic deployments across chains.
 * Base network support added for Clanker v4 compatibility.
 */

// Uniswap v4 PoolManager - Core singleton contract
export const UNISWAP_V4_POOL_MANAGER = {
  [1]: "0x000000000004444c5dc75cB358380D2e3dE08A90", // Ethereum
  [8453]: "0x498581ff718922c3f8e6a244956af099b2652b2b", // Base - Correct address
} as const

// Uniswap v4 Position Manager
export const UNISWAP_V4_POSITION_MANAGER = {
  [1]: "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e", // Ethereum
  [8453]: "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e", // Base
} as const

// Uniswap v4 Quoter
export const UNISWAP_V4_QUOTER = {
  [1]: "0x52f0e24d1c21c8a0cb1e5a5dd6198556bd9e1203", // Ethereum
  [8453]: "0x52f0e24d1c21c8a0cb1e5a5dd6198556bd9e1203", // Base
} as const

// Uniswap v4 StateView - For reading pool state
export const UNISWAP_V4_STATE_VIEW = {
  [1]: "0x7ffe42c4a5deea5b0fec41c94c136cf115597227", // Ethereum
  [8453]: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71", // Base - Correct address
} as const

// Universal Router for v4 swaps
export const UNISWAP_V4_UNIVERSAL_ROUTER = {
  [1]: "0x66a9893cc07d91d95644aedd05d03f95e1dba8af", // Ethereum
  [8453]: "0x6ff5693b99212da76ad316178a184ab56d299b43", // Base - Correct address
} as const

// Clanker Hook Contracts - Used by Clanker v4 deployments
export const CLANKER_HOOK_STATIC_FEE_V2 = {
  [8453]: "0xb429d62f8f3bFFb98CdB9569533eA23bF0Ba28CC", // Base
} as const

// Uniswap v4 PoolManager ABI (minimal for reading pool state)
export const UNISWAP_V4_POOL_MANAGER_ABI = [
  {
    inputs: [
      { name: "currency0", type: "address" },
      { name: "currency1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
      { name: "hooks", type: "address" },
    ],
    name: "getSlot0",
    outputs: [
      {
        components: [
          { name: "sqrtPriceX96", type: "uint160" },
          { name: "tick", type: "int24" },
          { name: "protocolFee", type: "uint24" },
          { name: "lpFee", type: "uint24" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "currency0", type: "address" },
      { name: "currency1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
      { name: "hooks", type: "address" },
    ],
    name: "getLiquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Uniswap v4 StateView ABI (for reading pool information)
export const UNISWAP_V4_STATE_VIEW_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "poolKey",
        type: "tuple",
      },
    ],
    name: "getSlot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "poolKey",
        type: "tuple",
      },
    ],
    name: "getLiquidity",
    outputs: [{ name: "liquidity", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Uniswap v4 Position Manager ABI (minimal for LP operations)
export const UNISWAP_V4_POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
            name: "poolKey",
            type: "tuple",
          },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "liquidity", type: "uint256" },
          { name: "amount0Max", type: "uint256" },
          { name: "amount1Max", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "modifyLiquidity",
    outputs: [
      { name: "delta0", type: "int256" },
      { name: "delta1", type: "int256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const

/**
 * Helper type for Uniswap v4 Pool Key
 */
export type PoolKey = {
  currency0: `0x${string}`
  currency1: `0x${string}`
  fee: number
  tickSpacing: number
  hooks: `0x${string}`
}

/**
 * Common hook addresses
 */
export const ZERO_HOOK_ADDRESS = "0x0000000000000000000000000000000000000000" as const

/**
 * Common tick spacings for v4
 */
export const V4_TICK_SPACINGS = {
  1: 1, // 0.0001% fee tier
  10: 10, // 0.01% fee tier
  60: 60, // 0.3% fee tier
  200: 200, // 1% fee tier
} as const

/**
 * Helper function to create a pool key
 */
export function createPoolKey(
  token0: `0x${string}`,
  token1: `0x${string}`,
  fee = 3000,
  tickSpacing = 60,
  hooks: `0x${string}` = ZERO_HOOK_ADDRESS,
): PoolKey {
  // Ensure token0 < token1
  const [currency0, currency1] = token0.toLowerCase() < token1.toLowerCase() ? [token0, token1] : [token1, token0]

  return {
    currency0,
    currency1,
    fee,
    tickSpacing,
    hooks,
  }
}
