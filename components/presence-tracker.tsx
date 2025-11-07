"use client"
import { usePresence } from "@/lib/hooks/use-presence"
import { useWallet } from "@/lib/web3/wallet-context"

export function PresenceTracker() {
  const { address } = useWallet()

  // Set base online status when logged in
  usePresence({
    status: address ? "online" : "offline",
  })

  return null
}
