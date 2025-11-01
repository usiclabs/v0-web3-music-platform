"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Loader2, Info, AlertCircle, Droplet, Plus, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import {
  UNISWAP_V3_POSITION_MANAGER,
  UNISWAP_V3_POSITION_MANAGER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  ERC20_ABI,
} from "@/lib/web3/contracts"
import { useWriteContract, usePublicClient } from "wagmi"
import { parseUnits } from "viem"
import confetti from "canvas-confetti"
import Image from "next/image"

const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006",
  84532: "0x4200000000000000000000000000000000000006",
} as const

interface AddLiquidityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenAddress: string
  tokenName?: string
  tokenSymbol?: string
  tokenImage?: string
}

export function AddLiquidityDrawer({
  open,
  onOpenChange,
  tokenAddress,
  tokenName,
  tokenSymbol,
  tokenImage,
}: AddLiquidityDrawerProps) {
  const { address, chainId } = useWallet()
  const { addToast } = useToast()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [feeTier, setFeeTier] = useState<500 | 3000 | 10000>(3000)
  const [ethAmount, setEthAmount] = useState("")
  const [tokenAmount, setTokenAmount] = useState("")
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [poolVersion, setPoolVersion] = useState<"v3" | "v4" | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)

  const wethAddress = chainId ? WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] : undefined

  useEffect(() => {
    if (open && tokenAddress && wethAddress && chainId && publicClient) {
      checkPoolExists()
    }
  }, [open, tokenAddress, wethAddress, feeTier, chainId, publicClient])

  const checkPoolExists = async () => {
    if (!chainId || !publicClient || !tokenAddress || !wethAddress) return

    setIsCheckingPool(true)
    setPoolExists(null)
    setPoolVersion(null)

    try {
      console.log("[v0] Checking for V3 pool...")
      const poolAddress = await publicClient.readContract({
        address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: "getPool",
        args: [wethAddress as `0x${string}`, tokenAddress as `0x${string}`, feeTier],
      })

      const exists = poolAddress !== "0x0000000000000000000000000000000000000000"
      setPoolExists(exists)
      setPoolVersion(exists ? "v3" : null)
    } catch (error) {
      console.error("[v0] Failed to check pool:", error)
      setPoolExists(null)
      setPoolVersion(null)
    } finally {
      setIsCheckingPool(false)
    }
  }

  const handleAddLiquidity = async () => {
    if (!address || !chainId || !tokenAddress || !wethAddress || !ethAmount || !tokenAmount) return

    setIsAddingLiquidity(true)
    try {
      const ethAmountParsed = parseUnits(ethAmount, 18)
      const tokenAmountParsed = parseUnits(tokenAmount, 18)

      addToast({
        title: "Approval Required",
        description: "Approving token for liquidity pool...",
        variant: "default",
      })

      await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
          tokenAmountParsed,
        ],
      })

      addToast({
        title: "Adding Liquidity",
        description: "Please confirm the transaction in your wallet...",
        variant: "default",
      })

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

      await writeContractAsync({
        address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: "mint",
        args: [
          {
            token0: wethAddress as `0x${string}`,
            token1: tokenAddress as `0x${string}`,
            fee: feeTier,
            tickLower: -887220,
            tickUpper: 887220,
            amount0Desired: ethAmountParsed,
            amount1Desired: tokenAmountParsed,
            amount0Min: 0n,
            amount1Min: 0n,
            recipient: address,
            deadline,
          },
        ],
        value: ethAmountParsed,
      })

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5", "#ffffff"],
      })

      addToast({
        title: "Liquidity Added!",
        description: "Successfully added liquidity to the pool",
        variant: "success",
      })

      setEthAmount("")
      setTokenAmount("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Failed to add liquidity:", error)
      addToast({
        title: "Failed to Add Liquidity",
        description: error.message?.includes("User rejected") ? "Transaction rejected" : "Failed to add liquidity",
        variant: "error",
      })
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5"
      >
        <SheetHeader className="space-y-4 pb-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-primary/50 p-3 rounded-2xl">
                <Droplet className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <SheetTitle className="text-2xl">Add Liquidity</SheetTitle>
              <SheetDescription>Provide liquidity and earn trading fees</SheetDescription>
            </div>
          </div>

          {/* Token Info */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-4">
            {tokenImage && (
              <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/30">
                <Image
                  src={tokenImage || "/placeholder.svg"}
                  alt={tokenSymbol || "Token"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">{tokenName || "Unknown Token"}</p>
              <p className="text-sm text-muted-foreground">{tokenSymbol || "???"}</p>
            </div>
            <a
              href={`https://basescan.org/token/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Fee Tier Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Fee Tier
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[500, 3000, 10000].map((fee) => (
                <Button
                  key={fee}
                  variant={feeTier === fee ? "default" : "outline"}
                  onClick={() => setFeeTier(fee as any)}
                  className={`${feeTier !== fee ? "bg-background/50 hover:bg-background" : "shadow-lg shadow-primary/25"}`}
                  size="sm"
                >
                  {(fee / 10000).toFixed(2)}%
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              0.05% for stablecoins, 0.3% for most pairs, 1% for exotic pairs
            </p>
          </div>

          {/* Pool Status */}
          {isCheckingPool ? (
            <div className="flex items-center gap-3 text-sm bg-muted/50 rounded-xl p-4 border border-border/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Checking pool availability...</span>
            </div>
          ) : poolExists === false ? (
            <div className="flex items-start gap-3 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No Uniswap V3 pool exists</p>
                <p className="text-xs mt-1">
                  This pool needs to be created first. Visit{" "}
                  <a href="/lp-manager" className="underline hover:text-amber-700 font-medium">
                    LP Manager
                  </a>{" "}
                  to create it.
                </p>
              </div>
            </div>
          ) : poolExists === true ? (
            <div className="flex items-center gap-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Uniswap V3 pool exists - ready to add liquidity</span>
            </div>
          ) : null}

          {/* Amount Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eth-amount" className="text-sm font-medium">
                ETH Amount
              </Label>
              <div className="relative">
                <Input
                  id="eth-amount"
                  type="number"
                  placeholder="0.0"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="text-lg h-14 bg-background/50 border-border/50 focus:border-primary/50 pr-16"
                  disabled={!poolExists}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  ETH
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token-amount" className="text-sm font-medium">
                {tokenSymbol || "Token"} Amount
              </Label>
              <div className="relative">
                <Input
                  id="token-amount"
                  type="number"
                  placeholder="0.0"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="text-lg h-14 bg-background/50 border-border/50 focus:border-primary/50 pr-20"
                  disabled={!poolExists}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground truncate max-w-[80px]">
                  {tokenSymbol || "TOKEN"}
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              This will add liquidity across the full price range. You'll earn fees from all trades in this pool. Your
              position will be represented as an LP NFT.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAddLiquidity}
              disabled={!ethAmount || !tokenAmount || poolExists === false || isAddingLiquidity}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            >
              {isAddingLiquidity ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Liquidity
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAddingLiquidity}
              className="h-12 bg-background/50"
            >
              Cancel
            </Button>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            {poolVersion && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool Version</span>
                <span className="font-medium">Uniswap V3</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Fee</span>
              <span className="font-medium">{(feeTier / 10000).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Range</span>
              <span className="font-medium">Full Range</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Base</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
