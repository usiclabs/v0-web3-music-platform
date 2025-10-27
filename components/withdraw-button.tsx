"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"

interface WithdrawButtonProps {
  amount: number
}

export function WithdrawButton({ amount }: WithdrawButtonProps) {
  const { address, isConnected } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first")
      return
    }

    if (amount <= 0) {
      alert("No funds available to withdraw")
      return
    }

    setIsLoading(true)

    try {
      // In production, this would:
      // 1. Verify the user owns the artist wallet
      // 2. Calculate total earnings from royalty splits
      // 3. Initiate USDC transfer from platform wallet to artist wallet
      // 4. Update database to mark earnings as withdrawn

      // For MVP, we'll simulate the withdrawal
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert(`Successfully withdrew ${amount.toFixed(2)} USDC to ${address}`)
    } catch (error) {
      console.error("[v0] Withdrawal error:", error)
      alert("Withdrawal failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleWithdraw} disabled={isLoading || amount <= 0} className="w-full">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Withdraw Funds
        </>
      )}
    </Button>
  )
}
