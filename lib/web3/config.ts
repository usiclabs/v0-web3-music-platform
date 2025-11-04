import { http, createConfig } from "wagmi"
import { base, baseSepolia } from "wagmi/chains"
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors"

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.")
}

if (typeof window !== "undefined") {
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
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ""
const BASE_RPC = ALCHEMY_API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : "https://mainnet.base.org" // Fallback to public Base RPC
const BASE_SEPOLIA_RPC = ALCHEMY_API_KEY
  ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : "https://sepolia.base.org" // Fallback to public Base Sepolia RPC

if (!ALCHEMY_API_KEY) {
  console.warn("NEXT_PUBLIC_ALCHEMY_API_KEY is not set. Using public RPC endpoints (rate limited).")
}

// Configure wagmi
export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected({
      shimDisconnect: true,
      // Target specific mobile wallets
      target() {
        return {
          id: "injected",
          name: "Injected Wallet",
          provider: typeof window !== "undefined" ? window.ethereum : undefined,
        }
      },
    }),
    coinbaseWallet({
      appName: "USI",
      appLogoUrl: typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : undefined,
    }),
    walletConnect({
      projectId,
      metadata: {
        name: "USI",
        description: "Web3 Music Streaming Platform",
        url: typeof window !== "undefined" ? window.location.origin : "https://usi.app",
        icons: [typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : ""],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [base.id]: http(BASE_RPC),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
