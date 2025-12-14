"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Zap } from "lucide-react"

interface BoostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artistAddress: string
  tokenAddress: string
  tokenSymbol: string
}

export function BoostModal({ open, onOpenChange, artistAddress, tokenAddress, tokenSymbol }: BoostModalProps) {
  const [ethAmount, setEthAmount] = useState("0.01")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const MIN_ETH = 0.001
  const MAX_ETH = 10

  const handleCreateBoost = async () => {
    try {
      const amount = Number.parseFloat(ethAmount)

      if (isNaN(amount) || amount < MIN_ETH || amount > MAX_ETH) {
        toast({
          title: "Invalid amount",
          description: `Boost amount must be between ${MIN_ETH} and ${MAX_ETH} ETH`,
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      const response = await fetch("/api/boosts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistAddress,
          tokenAddress,
          tokenSymbol,
          ethAmount: amount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create boost")
      }

      const data = await response.json()

      toast({
        title: "Boost created!",
        description: `MM agent wallet: ${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}`,
      })

      onOpenChange(false)
      setEthAmount("0.01")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create boost",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Boost {tokenSymbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">ETH Amount</label>
            <p className="text-xs text-muted-foreground mb-2">
              Minimum: {MIN_ETH} ETH, Maximum: {MAX_ETH} ETH
            </p>
            <Input
              type="number"
              step="0.001"
              min={MIN_ETH}
              max={MAX_ETH}
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="0.01"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0.001, 0.01, 0.1].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setEthAmount(amount.toString())}
                disabled={isLoading}
              >
                {amount} ETH
              </Button>
            ))}
          </div>

          <div className="bg-accent/10 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Strategy:</strong> 10% Profitable Trades
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Market maker will execute profitable buy/sell cycles on {tokenSymbol}. Artist earns trading fees from
              increased volume.
            </p>
          </div>

          <Button onClick={handleCreateBoost} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Boost
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
