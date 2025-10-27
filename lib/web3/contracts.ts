// Smart contract addresses and ABIs
export const USDC_ADDRESS = {
  [8453]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet
  [84532]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia testnet
} as const

export const USI_TOKEN_ADDRESS = {
  [8453]: "0x987603A52d8B966E10FBD29DcB1A574049E25B07", // Base mainnet
  [84532]: "0x987603A52d8B966E10FBD29DcB1A574049E25B07", // Base Sepolia (same for demo)
} as const

// Keep old export for backwards compatibility during transition
export const ANTI_TOKEN_ADDRESS = USI_TOKEN_ADDRESS

// Minimal ERC-20 ABI for USDC transfers
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
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
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
  NETWORK: "base",
  SCHEME: "exact", // exact payment scheme
} as const
