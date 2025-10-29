"use client"

import { base } from "wagmi/chains"

export async function connectViaWalletConnect(connectors: any[], connectAsync: any) {
  try {
    console.log("[v0] Attempting WalletConnect connection...")

    // Find the WalletConnect connector
    const walletConnectConnector = connectors.find((c) => c.type === "walletConnect")

    if (!walletConnectConnector) {
      throw new Error("WalletConnect connector not found")
    }

    console.log("[v0] Connecting with WalletConnect...")
    await connectAsync({ connector: walletConnectConnector, chainId: base.id })
    console.log("[v0] WalletConnect connection successful")
  } catch (error) {
    console.error("[v0] WalletConnect connection failed:", error)
    throw error
  }
}
