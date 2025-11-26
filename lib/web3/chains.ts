// Chain configuration and utilities for multi-chain support
import { base, baseSepolia, mainnet, arbitrum } from "wagmi/chains"
import { monad, unichain } from "./config"

// Supported chains
export const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  base: base,
  baseSepolia: baseSepolia,
  unichain: unichain,
  monad: monad,
} as const

export type SupportedChainId =
  | typeof mainnet.id
  | typeof arbitrum.id
  | typeof base.id
  | typeof baseSepolia.id
  | typeof unichain.id
  | typeof monad.id

// Chain-specific token addresses
export const TOKEN_ADDRESSES: Record<
  SupportedChainId,
  {
    USDC?: `0x${string}`
    WETH?: `0x${string}`
    wrappedNative: `0x${string}`
  }
> = {
  // Ethereum Mainnet
  [mainnet.id]: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    wrappedNative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  // Arbitrum One
  [arbitrum.id]: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    wrappedNative: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
  // Unichain
  [unichain.id]: {
    USDC: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    WETH: "0x4200000000000000000000000000000000000006",
    wrappedNative: "0x4200000000000000000000000000000000000006",
  },
  // Base Mainnet
  [base.id]: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    WETH: "0x4200000000000000000000000000000000000006",
    wrappedNative: "0x4200000000000000000000000000000000000006",
  },
  // Base Sepolia
  [baseSepolia.id]: {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    WETH: "0x4200000000000000000000000000000000000006",
    wrappedNative: "0x4200000000000000000000000000000000000006",
  },
  // Monad Mainnet
  [monad.id]: {
    USDC: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    WETH: "0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242",
    wrappedNative: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A",
  },
}

// Chain-specific block explorers
export const BLOCK_EXPLORERS: Record<
  SupportedChainId,
  {
    name: string
    url: string
    txPath: string
    addressPath: string
  }
> = {
  [mainnet.id]: {
    name: "Etherscan",
    url: "https://etherscan.io",
    txPath: "/tx/",
    addressPath: "/address/",
  },
  [arbitrum.id]: {
    name: "Arbiscan",
    url: "https://arbiscan.io",
    txPath: "/tx/",
    addressPath: "/address/",
  },
  [unichain.id]: {
    name: "Uniscan",
    url: "https://uniscan.xyz",
    txPath: "/tx/",
    addressPath: "/address/",
  },
  [base.id]: {
    name: "BaseScan",
    url: "https://basescan.org",
    txPath: "/tx/",
    addressPath: "/address/",
  },
  [baseSepolia.id]: {
    name: "BaseScan Sepolia",
    url: "https://sepolia.basescan.org",
    txPath: "/tx/",
    addressPath: "/address/",
  },
  [monad.id]: {
    name: "MonadVision",
    url: "https://monadvision.com",
    txPath: "/tx/",
    addressPath: "/address/",
  },
}

// Get explorer URL for a transaction
export function getTxExplorerUrl(chainId: SupportedChainId, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId]
  return `${explorer.url}${explorer.txPath}${txHash}`
}

// Get explorer URL for an address
export function getAddressExplorerUrl(chainId: SupportedChainId, address: string): string {
  const explorer = BLOCK_EXPLORERS[chainId]
  return `${explorer.url}${explorer.addressPath}${address}`
}

// Check if a chain is supported
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return (
    chainId === mainnet.id ||
    chainId === arbitrum.id ||
    chainId === base.id ||
    chainId === baseSepolia.id ||
    chainId === unichain.id ||
    chainId === monad.id
  )
}

// Get chain name
export function getChainName(chainId: SupportedChainId): string {
  switch (chainId) {
    case mainnet.id:
      return "Ethereum"
    case arbitrum.id:
      return "Arbitrum"
    case unichain.id:
      return "Unichain"
    case base.id:
      return "Base"
    case baseSepolia.id:
      return "Base Sepolia"
    case monad.id:
      return "Monad"
    default:
      return "Unknown"
  }
}

// Monad-specific considerations
export const MONAD_CONFIG = {
  blockTimeMs: 400,
  finalityMs: 800,
  chargesGasLimit: true,
  reserveBalance: 10,
}

export const CHAIN_CONFIGS = {
  [mainnet.id]: {
    blockTimeMs: 12000,
    finalityBlocks: 64,
  },
  [arbitrum.id]: {
    blockTimeMs: 250,
    finalityMs: 900000, // ~15 min to L1
  },
  [unichain.id]: {
    blockTimeMs: 1000,
    isL2: true,
  },
  [base.id]: {
    blockTimeMs: 2000,
    isL2: true,
  },
  [baseSepolia.id]: {
    blockTimeMs: 2000,
    isL2: true,
    isTestnet: true,
  },
  [monad.id]: {
    blockTimeMs: 400,
    finalityMs: 800,
    chargesGasLimit: true,
  },
}
