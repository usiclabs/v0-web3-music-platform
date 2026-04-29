// Smart contract addresses and ABIs
export const USDC_ADDRESS = {
  [8453]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet
  [84532]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia testnet
  [143]: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // Monad mainnet
  [41454]: "0x534b2f3A21130d7a60830c2Df862319e593943A3", // Monad testnet
} as const

export const USI_TOKEN_ADDRESS = {
  [8453]: "0xECE5d962d17901ef200Da050C7c74AB45C96Db07", // Base mainnet - Real $USI token
  [84532]: "0xECE5d962d17901ef200Da050C7c74AB45C96Db07", // Base Sepolia (same for demo)
} as const

// Keep old export for backwards compatibility during transition
export const ANTI_TOKEN_ADDRESS = USI_TOKEN_ADDRESS

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// USDC transferWithAuthorization ABI for X402 EIP-3009 payments
export const USDC_TRANSFER_WITH_AUTHORIZATION_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    name: "transferWithAuthorization",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    name: "authorizationState",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Complete EIP-3009 ABI for USDC
export const EIP3009_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    name: "transferWithAuthorization",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    name: "receiveWithAuthorization",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    name: "cancelAuthorization",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    name: "authorizationState",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const USDC_ABI = EIP3009_ABI

export const UNISWAP_V3_ROUTER = {
  [8453]: "0x2626664c2603336E57B271c5C0b26F421741e481", // SwapRouter02 on Base
  [84532]: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4", // SwapRouter02 on Base Sepolia
} as const

export const UNISWAP_V3_QUOTER = {
  [8453]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a", // QuoterV2 on Base
  [84532]: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27", // QuoterV2 on Base Sepolia
} as const

export const UNISWAP_V3_FACTORY = {
  [8453]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD", // Factory on Base
  [84532]: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24", // Factory on Base Sepolia
} as const

// ERC-1155 ABI for NFT minting and transfers
export const ERC1155_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "ids", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "data", type: "bytes" },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "ids", type: "uint256[]" },
    ],
    name: "balanceOfBatch",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const UNISWAP_V3_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const

export const UNISWAP_V3_FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const UNISWAP_V3_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// X402 Facilitator endpoints
export const X402_FACILITATOR = {
  VERIFY_URL: "https://api.developer.coinbase.com/v2/x402/verify",
  SETTLE_URL: "https://api.developer.coinbase.com/v2/x402/settle",
} as const

// X402 configuration
export const X402_CONFIG = {
  CHUNK_DURATION: 30, // 30 seconds per chunk as per X402 spec
  NETWORKS: {
    base: {
      name: "base",
      chainId: 8453,
      testnetChainId: 84532,
    },
    monad: {
      name: "monad",
      chainId: 143,
      testnetChainId: 41454,
    },
  },
  SCHEME: "exact", // exact payment scheme
} as const

// Helper to get network name from chain ID
export function getX402Network(chainId: number): string {
  if (chainId === 8453 || chainId === 84532) return "base"
  if (chainId === 143 || chainId === 41454) return "monad"
  return "base" // Default to base for backwards compatibility
}

// Uniswap V3 Position Manager contract addresses
export const UNISWAP_V3_POSITION_MANAGER = {
  [8453]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1", // NonfungiblePositionManager on Base
  [84532]: "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2", // NonfungiblePositionManager on Base Sepolia
} as const

// Uniswap V3 Pool ABI
export const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fee",
    outputs: [{ name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Uniswap V3 Position Manager ABI
export const UNISWAP_V3_POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "token0", type: "address" },
          { name: "token1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "mint",
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "increaseLiquidity",
    outputs: [
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "liquidity", type: "uint128" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "decreaseLiquidity",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount0Max", type: "uint128" },
          { name: "amount1Max", type: "uint128" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "collect",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "positions",
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "sqrtPriceX96", type: "uint160" },
    ],
    name: "createAndInitializePoolIfNecessary",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
] as const

// Uniswap V4 contract addresses and ABIs
// Uniswap V4 contracts on Base
export const UNISWAP_V4_POOL_MANAGER = {
  [8453]: "0x498581ff718922c3f8e6a244956af099b2652b2b", // PoolManager on Base
  [84532]: "0x498581ff718922c3f8e6a244956af099b2652b2b", // PoolManager on Base Sepolia
} as const

export const UNISWAP_V4_POSITION_MANAGER = {
  [8453]: "0x7c5f5a4bbd8fd631845775253326123b519429bdc", // PositionManager on Base
  [84532]: "0x7c5f5a4bbd8fd631845775253326123b519429bdc", // PositionManager on Base Sepolia
} as const

export const UNISWAP_V4_STATE_VIEW = {
  [8453]: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71", // StateView on Base
  [84532]: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71", // StateView on Base Sepolia
} as const

export const UNISWAP_V4_QUOTER = {
  [8453]: "0x0d5e0f971ed27fbff6c2837bf313161215320048d", // Quoter on Base
  [84532]: "0x0d5e0f971ed27fbff6c2837bf313161215320048d", // Quoter on Base Sepolia
} as const

export const PERMIT2_ADDRESS = {
  [8453]: "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Permit2 on Base
  [84532]: "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Permit2 on Base Sepolia
} as const

// V4 Position Manager ABI (command-based interface)
export const UNISWAP_V4_POSITION_MANAGER_ABI = [
  {
    inputs: [
      { name: "unlockData", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
    name: "modifyLiquidities",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getPositionInfo",
    outputs: [
      {
        components: [
          { name: "poolKey", type: "bytes32" },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// V4 Actions enum
export const V4_ACTIONS = {
  INCREASE_LIQUIDITY: 0x00,
  DECREASE_LIQUIDITY: 0x01,
  MINT_POSITION: 0x02,
  BURN_POSITION: 0x03,
  SETTLE_PAIR: 0x0d,
  TAKE_PAIR: 0x11,
  CLOSE_CURRENCY: 0x12,
  CLEAR_OR_TAKE: 0x13,
  BURN_6909: 0x18,
} as const

// V4 Pool Manager ABI
export const UNISWAP_V4_POOL_MANAGER_ABI = [
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
        name: "key",
        type: "tuple",
      },
    ],
    name: "getPoolId",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "bytes32" }],
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
    inputs: [{ name: "id", type: "bytes32" }],
    name: "getLiquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// V4 StateView ABI
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
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const UNIVERSAL_ROUTER = {
  [8453]: "0x6ff5693b99212da76ad316178a184ab56d299b43", // Universal Router on Base
  [84532]: "0x6ff5693b99212da76ad316178a184ab56d299b43", // Universal Router on Base Sepolia
} as const

// Universal Router ABI for V4 swaps
export const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const

// Permit2 ABI
export const PERMIT2_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// V4 Commands for Universal Router
export const V4_COMMANDS = {
  V4_SWAP: 0x00,
  V4_POSITION_CALL: 0x01,
  PERMIT2_PERMIT: 0x0a,
} as const

export const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006",
  84532: "0x4200000000000000000000000000000000000006",
} as const
