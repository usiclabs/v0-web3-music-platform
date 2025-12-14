"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { Loader2, Zap } from "lucide-react"
import type { Address } from "viem"

interface BoostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenAddress: Address
  tokenSymbol: string
  artistAddress: Address
  artistName: string
}

export function BoostModal({
  open,
  onOpenChange,
  tokenAddress,
  tokenSymbol,
  artistAddress,
  artistName,
}: BoostModalProps) {
  const [fundingAmount, setFundingAmount] = useState("0.01")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { address: userAddress } = useWallet()

  const handleCreateBoost = async () => {
    if (!userAddress) {
      toast({ title: "Connect wallet", description: "Please connect your wallet to create a boost" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/boosts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boostedByAddress: userAddress,
          artistAddress,
          tokenAddress,
          tokenSymbol,
          fundingAmountEth: Number.parseFloat(fundingAmount),
        }),
      })

      if (!response.ok) throw new Error(await response.text())

      const data = await response.json()

      toast({
        title: "Boost created!",
        description: `Started boosting ${artistName}'s token with ${fundingAmount} ETH`,
      })

      onOpenChange(false)
      setFundingAmount("0.01")
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Boost {artistName}'s Token
          </DialogTitle>
          <DialogDescription>
            Fund an autonomous market maker to increase token volume and earn profits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-secondary/50 p-3 text-sm text-secondary-foreground">
            <div className="mb-2 font-semibold">10% Profitable Strategy</div>
            <div className="space-y-1 text-xs opacity-90">
              <div>• Autonomous buy/sell execution</div>
              <div>• Share profits with {artistName}</div>
              <div>• Zero management required</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="funding">
              Funding Amount (ETH)
              <span className="ml-2 text-xs text-muted-foreground">Min: 0.001 ETH</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="funding"
                type="number"
                step="0.001"
                min="0.001"
                max="100"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                placeholder="0.01"
              />
              <Button variant="outline" size="sm" onClick={() => setFundingAmount("0.01")} className="px-3">
                0.01 ETH
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFundingAmount("0.05")} className="px-3">
                0.05 ETH
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm">
            <div className="font-semibold text-accent">Expected Returns</div>
            <div className="mt-2 text-xs opacity-80">
              <div>Funding: {fundingAmount} ETH</div>
              <div>Strategy: 10% profitable per cycle</div>
              <div>Artist cut: 20% of profits</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreateBoost}
            disabled={isLoading || Number.parseFloat(fundingAmount) < 0.001}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Create Boost
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
