"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useAccount, useConnect, useDisconnect, useSwitchChain, useSignTypedData } from "wagmi"
import { base } from "wagmi/chains"
import type { Address } from "viem"

interface WalletContextType {
  address: Address | null
  isConnected: boolean
  chainId: number | null
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
  signTypedData: (domain: any, types: any, value: any) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { signTypedDataAsync } = useSignTypedData()

  useEffect(() => {
    const autoConnectInjected = async () => {
      // Check if we're in a mobile wallet in-app browser
      const isMobileWallet =
        typeof window !== "undefined" && window.ethereum && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)

      // If already connected or no injected provider, skip
      if (isConnected || !isMobileWallet) return

      console.log("[v0] Detected mobile wallet environment, attempting auto-connect...")

      try {
        // Find the injected connector (should be first in the list)
        const injectedConnector = connectors.find((c) => c.type === "injected")

        if (injectedConnector) {
          console.log("[v0] Auto-connecting to injected provider:", injectedConnector.name)
          await connectAsync({ connector: injectedConnector, chainId: base.id })
          console.log("[v0] Auto-connect successful")
        }
      } catch (error) {
        // Silent fail for auto-connect - user can manually connect if needed
        console.log("[v0] Auto-connect failed (this is normal if user hasn't approved):", error)
      }
    }

    autoConnectInjected()
  }, [isConnected, connectors, connectAsync])

  const connect = async () => {
    try {
      console.log("[v0] Manual wallet connection requested")
      console.log(
        "[v0] Available connectors:",
        connectors.map((c) => ({ name: c.name, type: c.type })),
      )

      let connector = connectors.find((c) => c.type === "injected")

      // If no injected connector or not in mobile environment, use first available
      if (!connector) {
        connector = connectors[0]
      }

      if (!connector) {
        alert(
          "No wallet connector available. Please install a Web3 wallet like MetaMask, Base Wallet, or Trust Wallet.",
        )
        return
      }

      console.log("[v0] Connecting with:", connector.name, connector.type)
      await connectAsync({ connector, chainId: base.id })
      console.log("[v0] Connection successful")
    } catch (error) {
      console.error("[v0] Failed to connect wallet:", error)

      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          // User cancelled, no need to show error
          return
        }
        if (error.message.includes("Already processing")) {
          alert("Connection already in progress. Please check your wallet app.")
          return
        }
        if (error.message.includes("Connector not found")) {
          alert("Wallet not detected. Please make sure you're using a Web3-enabled browser or wallet app.")
          return
        }
      }

      alert("Failed to connect wallet. Please try again or use a different wallet.")
    }
  }

  const disconnect = async () => {
    try {
      await disconnectAsync()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  const switchChain = async (targetChainId: number) => {
    try {
      await switchChainAsync({ chainId: targetChainId })
    } catch (error) {
      console.error("Failed to switch chain:", error)
      throw error
    }
  }

  const signTypedData = async (domain: any, types: any, value: any): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected")
    }

    try {
      console.log("[v0] Requesting signature from wallet...")
      console.log("[v0] Signing typed data with domain:", domain.name, "chainId:", domain.chainId)
      console.log("[v0] Message fields:", Object.keys(value).join(", "))

      const isMobile = typeof window !== "undefined" && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
      console.log("[v0] Mobile device detected:", isMobile)

      if (typeof window !== "undefined" && window.ethereum) {
        const provider = window.ethereum as any
        console.log(
          "[v0] Wallet provider detected:",
          provider.isMetaMask
            ? "MetaMask"
            : provider.isTrust
              ? "Trust Wallet"
              : provider.isCoinbaseWallet
                ? "Coinbase Wallet"
                : "Unknown",
        )

        // Check if the method exists
        const hasSignTypedData = typeof provider.request === "function"
        console.log("[v0] Provider has request method:", hasSignTypedData)
      }

      const timeoutMs = isMobile ? 120000 : 60000 // 2 minutes for mobile, 1 minute for desktop
      console.log("[v0] Using timeout:", timeoutMs, "ms")

      const signaturePromise = signTypedDataAsync({
        domain,
        types,
        primaryType: "TransferWithAuthorization",
        message: value,
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Signature request timed out after ${timeoutMs / 1000} seconds. Please try again.`))
        }, timeoutMs)
      })

      const signature = await Promise.race([signaturePromise, timeoutPromise])

      console.log("[v0] Signature received:", signature)
      console.log("[v0] Signature length:", signature.length)

      if (!signature || signature.length < 128) {
        throw new Error("Invalid signature received from wallet")
      }

      return signature
    } catch (error) {
      console.error("[v0] Failed to sign typed data:", error)
      console.error("[v0] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      if (error instanceof Error) {
        if (
          error.message.includes("User rejected") ||
          error.message.includes("User denied") ||
          error.message.includes("User cancelled")
        ) {
          throw new Error(
            "You cancelled the signature request. Please try again and approve the signature in your wallet.",
          )
        }
        if (error.message.includes("timeout") || error.message.includes("timed out")) {
          throw new Error(
            "Signature request timed out. This can happen on slow mobile connections. Please ensure you have a stable internet connection and try again.",
          )
        }
        if (error.message.includes("Invalid parameters") || error.message.includes("eth_signTypedData")) {
          throw new Error(
            "Your wallet doesn't fully support EIP-712 signatures. Please try using MetaMask, Coinbase Wallet, or Base Wallet for the best experience.",
          )
        }
        if (error.message.includes("Unknown method") || error.message.includes("not supported")) {
          throw new Error(
            "Your wallet doesn't support the required signature method. Please use MetaMask, Coinbase Wallet, or Base Wallet.",
          )
        }
        if (error.message.includes("network") || error.message.includes("fetch")) {
          throw new Error(
            "Network error while requesting signature. Please check your internet connection and try again.",
          )
        }
        if (error.message.includes("Invalid signature received")) {
          throw error
        }
      }

      throw new Error("Failed to sign payment authorization. Please ensure your wallet is unlocked and try again.")
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address: address || null,
        isConnected,
        chainId: chainId || null,
        connect,
        disconnect,
        switchChain,
        signTypedData,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
