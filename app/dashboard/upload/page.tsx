"use client"

import { UploadForm } from "@/components/upload-form"
import { useWallet } from "@/lib/web3/wallet-context"
import { useReadContract, useChainId } from "wagmi"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { formatUnits } from "viem"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const { address, isConnected } = useWallet()
  const chainId = useChainId()
  const router = useRouter()

  const { data: usiBalance, isLoading } = useReadContract({
    address: chainId ? (USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!chainId,
    },
  })

  const REQUIRED_USI_BALANCE = BigInt("10000000000000000000000000") // 10,000,000 tokens with 18 decimals
  const hasRequiredUSI = usiBalance ? (usiBalance as bigint) >= REQUIRED_USI_BALANCE : false
  const usiBalanceFormatted = usiBalance ? formatUnits(usiBalance as bigint, 18) : "0"

  if (isConnected && isLoading) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isConnected && !hasRequiredUSI) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Upload Track</h1>
              <p className="text-muted-foreground">Upload your music, set pricing, and define royalty splits</p>
            </div>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-accent" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Token-Gated Feature</h2>
                  <p className="text-muted-foreground max-w-md">
                    To upload tracks on USIC, you need to hold at least{" "}
                    <span className="font-semibold text-accent">10,000,000 $USI</span> tokens.
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-4">
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Required Balance:</span>
                      <span className="font-mono font-semibold text-accent">10,000,000 $USI</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your Balance:</span>
                      <span className="font-mono font-semibold">
                        {Number.parseFloat(usiBalanceFormatted).toLocaleString()} $USI
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button onClick={() => router.push("/swap")} className="w-full">
                      Get $USI Tokens
                    </Button>
                    <Button onClick={() => router.back()} variant="outline" className="w-full bg-transparent">
                      Go Back
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground max-w-md">
                  <p>
                    $USI is the native token of the USIC platform. You can acquire $USI tokens by swapping USDC or ETH
                    on our swap page.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Track</h1>
            <p className="text-muted-foreground">Upload your music, set pricing, and define royalty splits</p>
          </div>

          <UploadForm />
        </div>
      </main>
    </div>
  )
}
