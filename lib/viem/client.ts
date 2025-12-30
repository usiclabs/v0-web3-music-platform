import { createPublicClient, createWalletClient, custom, http } from "viem"
import { base } from "viem/chains"

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
})

// This uses the browser's injected provider which is set by the user's wallet (MetaMask, etc.)
export const walletClient = createWalletClient({
  chain: base,
  transport: custom({
    request: async (request: any) => {
      if (typeof window === "undefined") {
        throw new Error("Wallet client can only be used in the browser")
      }

      // Try to use the injected Ethereum provider from the browser
      const provider = (window as any).ethereum

      if (!provider) {
        throw new Error("No Ethereum provider found. Please install a wallet extension.")
      }

      return provider.request(request)
    },
  }),
})
