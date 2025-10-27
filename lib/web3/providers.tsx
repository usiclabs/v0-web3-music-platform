"use client"

import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { config } from "./config"
import { WalletProvider } from "./wallet-context"
import type { ReactNode } from "react"
import { useState } from "react"

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
