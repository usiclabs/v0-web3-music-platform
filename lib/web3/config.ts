import { http, createConfig } from "wagmi"
import { base, baseSepolia, mainnet, arbitrum } from "wagmi/chains"
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors"

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.")
}

// Safe window access
const getOrigin = () => {
  try {
    return typeof window !== "undefined" ? window.location.origin : "https://myusic.xyz"
  } catch {
    return "https://myusic.xyz"
  }
}

const getEthereumProvider = () => {
  try {
    return typeof window !== "undefined" ? (window as any).ethereum : undefined
  } catch {
    return undefined
  }
}

if (typeof window !== "undefined") {
  try {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        // Suppress analytics errors from WalletConnect/Reown
        if (args[0]?.toString().includes("pulse.walletconnect.org")) {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        return await originalFetch(...args)
      } catch (error) {
        // Silently fail for analytics endpoints
        if (args[0]?.toString().includes("pulse.walletconnect.org")) {
          return new Response(JSON.stringify({ success: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        throw error
      }
    }
  } catch (error) {
    console.warn("[v0] Could not wrap fetch:", error)
  }
}

const ETHEREUM_RPC_ENDPOINTS = [
  "https://eth.llamarpc.com",
  "https://ethereum.publicnode.com",
  "https://rpc.ankr.com/eth",
]

const ARBITRUM_RPC_ENDPOINTS = [
  "https://arb1.arbitrum.io/rpc",
  "https://arbitrum.llamarpc.com",
  "https://rpc.ankr.com/arbitrum",
]

const UNICHAIN_RPC_ENDPOINTS = ["https://mainnet.unichain.org"]

const MONAD_RPC_ENDPOINTS = ["https://rpc.monad.xyz", "https://rpc1.monad.xyz", "https://rpc3.monad.xyz"]

const BASE_RPC_ENDPOINTS = [
  "https://base-rpc.publicnode.com", // More reliable public node
  "https://base.blockpi.network/v1/rpc/public",
  "https://1rpc.io/base",
  "https://mainnet.base.org",
]

const BASE_SEPOLIA_RPC_ENDPOINTS = [
  "https://sepolia.base.org",
  "https://base-sepolia.blockpi.network/v1/rpc/public",
  "https://base-sepolia-rpc.publicnode.com",
]

const unichain = {
  id: 130,
  name: "Unichain",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://mainnet.unichain.org"] },
    public: { http: ["https://mainnet.unichain.org"] },
  },
  blockExplorers: {
    default: { name: "Uniscan", url: "https://uniscan.xyz" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
    },
  },
} as const

const monad = {
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
    public: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
    monadscan: { name: "Monadscan", url: "https://monadscan.com" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
    },
  },
} as const

// Configure wagmi
export const config = createConfig({
  chains: [base, mainnet, arbitrum, unichain, monad, baseSepolia],
  connectors: [
    injected({
      shimDisconnect: true,
      // Target specific mobile wallets
      target() {
        return {
          id: "injected",
          name: "Injected Wallet",
          provider: getEthereumProvider(),
        }
      },
    }),
    coinbaseWallet({
      appName: "USI",
      appLogoUrl: `${getOrigin()}/images/logo.png`,
    }),
    walletConnect({
      projectId,
      metadata: {
        name: "USI",
        description: "Web3 Music Streaming Platform",
        url: getOrigin(),
        icons: [`${getOrigin()}/images/logo.png`],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(ETHEREUM_RPC_ENDPOINTS[0], {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
    [arbitrum.id]: http(ARBITRUM_RPC_ENDPOINTS[0], {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
    [unichain.id]: http(UNICHAIN_RPC_ENDPOINTS[0], {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
    [base.id]: http(BASE_RPC_ENDPOINTS[0], {
      batch: {
        wait: 50, // Added request batching to reduce RPC calls
        batchSize: 25,
      },
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC_ENDPOINTS[0], {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
    [monad.id]: http(MONAD_RPC_ENDPOINTS[0], {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
})

export { monad, unichain }

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
