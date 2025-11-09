"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Loader2,
  Info,
  AlertCircle,
  Droplet,
  Plus,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Percent,
  Lock,
  Unlock,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UNISWAP_V3_POSITION_MANAGER,
  UNISWAP_V3_POSITION_MANAGER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_POOL_ABI,
  UNISWAP_V4_POSITION_MANAGER,
  UNISWAP_V4_POSITION_MANAGER_ABI,
  UNISWAP_V4_STATE_VIEW,
  UNISWAP_V4_STATE_VIEW_ABI,
  V4_ACTIONS,
  WETH_ADDRESS,
  ERC20_ABI,
} from "@/lib/web3/contracts"
import {
  encodeV4LiquidityActions,
  encodeMintPositionParams,
  encodeSettlePairParams,
  calculateLiquidity,
  getTickSpacing,
  getNearestValidTick,
  type PoolKey,
} from "@/lib/web3/uniswap-v4-liquidity"
import { usePublicClient, useWriteContract, useReadContract } from "wagmi"
import type { Address } from "viem"
import { parseUnits, formatUnits } from "viem"
import Image from "next/image"
import confetti from "canvas-confetti"

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
  const [poolAddress, setPoolAddress] = useState<string | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [isCreatingPool, setIsCreatingPool] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)
  const [isV4Pool, setIsV4Pool] = useState(false)
  const [v4PoolKey, setV4PoolKey] = useState<PoolKey | null>(null)
  const [liquidityMode, setLiquidityMode] = useState<"balanced" | "custom">("balanced")
  const [priceRangeMode, setPriceRangeMode] = useState<"full" | "concentrated">("full")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [ethBalance, setEthBalance] = useState<bigint>(0n)
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n)

  const wethAddress = chainId ? WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] : undefined

  const { data: ethBalanceData } = useReadContract({
    address: wethAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!wethAddress },
  })

  const { data: tokenBalanceData } = useReadContract({
    address: tokenAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddress },
  })

  useEffect(() => {
    if (ethBalanceData) setEthBalance(ethBalanceData as bigint)
    if (tokenBalanceData) setTokenBalance(tokenBalanceData as bigint)
  }, [ethBalanceData, tokenBalanceData])

  const handlePercentageClick = (percentage: number, isEth: boolean) => {
    const balance = isEth ? ethBalance : tokenBalance
    const amount = (balance * BigInt(percentage)) / 100n
    const formatted = formatUnits(amount, 18)

    if (isEth) {
      setEthAmount(formatted)
      if (liquidityMode === "balanced" && currentPrice) {
        const tokenAmt = Number(formatted) * Number(currentPrice)
        setTokenAmount(tokenAmt.toFixed(6))
      }
    } else {
      setTokenAmount(formatted)
      if (liquidityMode === "balanced" && currentPrice) {
        const ethAmt = Number(formatted) / Number(currentPrice)
        setEthAmount(ethAmt.toFixed(6))
      }
    }
  }

  const { data: poolData, refetch: refetchPool } = useReadContract({
    address: poolAddress as `0x${string}` | undefined,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: "slot0",
    query: { enabled: !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000" },
  })

  const { data: poolLiquidity } = useReadContract({
    address: poolAddress as `0x${string}` | undefined,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: "liquidity",
    query: { enabled: !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000" },
  })

  useEffect(() => {
    if (open && tokenAddress && wethAddress && chainId) {
      checkPoolExists()
    }
  }, [open, tokenAddress, wethAddress, feeTier, chainId])

  useEffect(() => {
    if (poolData && Array.isArray(poolData) && poolData[0]) {
      const sqrtPriceX96 = poolData[0] as bigint
      const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2
      setCurrentPrice(price.toFixed(6))

      if (priceRangeMode === "concentrated" && !minPrice && !maxPrice) {
        const minPriceVal = (price * 0.8).toFixed(6)
        const maxPriceVal = (price * 1.2).toFixed(6)
        setMinPrice(minPriceVal)
        setMaxPrice(maxPriceVal)
      }
    }
  }, [poolData, priceRangeMode])

  const checkPoolExists = async () => {
    if (!chainId || !publicClient || !tokenAddress || !wethAddress) return

    setIsCheckingPool(true)
    try {
      const v3Pool = await publicClient.readContract({
        address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: "getPool",
        args: [wethAddress as `0x${string}`, tokenAddress as `0x${string}`, feeTier],
      })

      if (v3Pool && v3Pool !== "0x0000000000000000000000000000000000000000") {
        console.log("[v0] V3 pool found:", v3Pool)
        setPoolAddress(v3Pool as string)
        setIsV4Pool(false)
        setV4PoolKey(null)
        return
      }

      console.log("[v0] No V3 pool found, checking for V4 pool...")

      const [currency0, currency1] =
        wethAddress.toLowerCase() < tokenAddress.toLowerCase()
          ? [wethAddress, tokenAddress]
          : [tokenAddress, wethAddress]

      const poolKey: PoolKey = {
        currency0: currency0 as Address,
        currency1: currency1 as Address,
        fee: feeTier,
        tickSpacing: getTickSpacing(feeTier),
        hooks: "0x0000000000000000000000000000000000000000" as Address,
      }

      const v4Slot0 = await publicClient.readContract({
        address: UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW] as `0x${string}`,
        abi: UNISWAP_V4_STATE_VIEW_ABI,
        functionName: "getSlot0",
        args: [poolKey],
      })

      if (v4Slot0 && Array.isArray(v4Slot0) && v4Slot0[0] && v4Slot0[0] !== 0n) {
        console.log("[v0] V4 pool found with slot0:", v4Slot0)
        setPoolAddress("v4-pool")
        setIsV4Pool(true)
        setV4PoolKey(poolKey)

        const sqrtPriceX96 = v4Slot0[0] as bigint
        const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2
        setCurrentPrice(price.toFixed(6))
      } else {
        console.log("[v0] No V4 pool found")
        setPoolAddress(null)
        setIsV4Pool(false)
        setV4PoolKey(null)
      }
    } catch (error) {
      console.error("[v0] Failed to check pool:", error)
      setPoolAddress(null)
      setIsV4Pool(false)
      setV4PoolKey(null)
    } finally {
      setIsCheckingPool(false)
    }
  }

  const handleCreatePool = async () => {
    if (!address || !chainId || !tokenAddress || !wethAddress) return

    setIsCreatingPool(true)
    try {
      addToast({
        title: "Creating Pool",
        description: "Please confirm the transaction to create the liquidity pool...",
        variant: "default",
      })

      const sqrtPriceX96 = BigInt("79228162514264337593543950336")

      const newPoolAddress = await writeContractAsync({
        address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: "createAndInitializePoolIfNecessary",
        args: [wethAddress as `0x${string}`, tokenAddress as `0x${string}`, feeTier, sqrtPriceX96],
      })

      addToast({
        title: "Pool Created!",
        description: "Liquidity pool created successfully. You can now add liquidity.",
        variant: "success",
      })

      await checkPoolExists()
    } catch (error: any) {
      console.error("[v0] Failed to create pool:", error)
      addToast({
        title: "Failed to Create Pool",
        description: error.message?.includes("User rejected") ? "Transaction rejected" : "Failed to create pool",
        variant: "error",
      })
    } finally {
      setIsCreatingPool(false)
    }
  }

  const handleAddLiquidity = async () => {
    if (!address || !chainId || !tokenAddress || !wethAddress || !ethAmount || !tokenAmount) return

    setIsAddingLiquidity(true)
    try {
      const ethAmountParsed = parseUnits(ethAmount, 18)
      const tokenAmountParsed = parseUnits(tokenAmount, 18)

      if (isV4Pool && v4PoolKey) {
        await addV4Liquidity(ethAmountParsed, tokenAmountParsed)
      } else {
        await addV3Liquidity(ethAmountParsed, tokenAmountParsed)
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5", "#ffffff"],
      })

      addToast({
        title: "Liquidity Added!",
        description: `Successfully added ${ethAmount} ETH and ${tokenAmount} ${tokenSymbol} to the pool`,
        variant: "success",
      })

      setEthAmount("")
      setTokenAmount("")
      refetchPool()
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

  const addV3Liquidity = async (ethAmountParsed: bigint, tokenAmountParsed: bigint) => {
    if (!address || !chainId || !tokenAddress || !wethAddress) return

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
  }

  const addV4Liquidity = async (ethAmountParsed: bigint, tokenAmountParsed: bigint) => {
    if (!address || !chainId || !tokenAddress || !wethAddress || !v4PoolKey) return

    addToast({
      title: "Approval Required",
      description: "Approving token for V4 liquidity pool...",
      variant: "default",
    })

    await writeContractAsync({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [
        UNISWAP_V4_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V4_POSITION_MANAGER] as `0x${string}`,
        tokenAmountParsed,
      ],
    })

    addToast({
      title: "Adding V4 Liquidity",
      description: "Please confirm the transaction in your wallet...",
      variant: "default",
    })

    const tickLower = getNearestValidTick(-887220, v4PoolKey.tickSpacing)
    const tickUpper = getNearestValidTick(887220, v4PoolKey.tickSpacing)
    const liquidity = calculateLiquidity(ethAmountParsed, tokenAmountParsed, tickLower, tickUpper)

    const mintParams = encodeMintPositionParams({
      poolKey: v4PoolKey,
      tickLower,
      tickUpper,
      liquidity,
      amount0Max: ethAmountParsed,
      amount1Max: tokenAmountParsed,
      owner: address,
      hookData: "0x" as `0x${string}`,
    })

    const settleParams = encodeSettlePairParams(v4PoolKey.currency0, v4PoolKey.currency1)

    const unlockData = encodeV4LiquidityActions(
      [V4_ACTIONS.MINT_POSITION, V4_ACTIONS.SETTLE_PAIR],
      [mintParams, settleParams],
    )

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

    await writeContractAsync({
      address: UNISWAP_V4_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V4_POSITION_MANAGER] as `0x${string}`,
      abi: UNISWAP_V4_POSITION_MANAGER_ABI,
      functionName: "modifyLiquidities",
      args: [unlockData, deadline],
      value: ethAmountParsed,
    })
  }

  const poolExists = poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5"
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
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
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

          {isCheckingPool ? (
            <div className="flex items-center gap-3 text-sm bg-muted/50 rounded-xl p-4 border border-border/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Checking pool availability...</span>
            </div>
          ) : !poolExists ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pool doesn't exist</p>
                  <p className="text-xs mt-1">Create a new liquidity pool to get started</p>
                </div>
              </div>
              <Button
                onClick={handleCreatePool}
                disabled={isCreatingPool}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                {isCreatingPool ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Pool...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Pool
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">
                  {isV4Pool ? "Uniswap V4 pool" : "Uniswap V3 pool"} - ready to add liquidity
                </span>
              </div>
              {currentPrice && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {currentPrice} ETH
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Total Liquidity</p>
                    <p className="text-sm font-semibold">
                      {poolLiquidity ? formatUnits(poolLiquidity as bigint, 18).slice(0, 8) : "0"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Tabs value={liquidityMode} onValueChange={(v) => setLiquidityMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="balanced" className="gap-2">
                <Lock className="h-4 w-4" />
                Balanced
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Unlock className="h-4 w-4" />
                Custom Ratio
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="eth-amount" className="text-sm font-medium">
                  ETH Amount
                </Label>
                <span className="text-xs text-muted-foreground">
                  Balance: {formatUnits(ethBalance, 18).slice(0, 8)} ETH
                </span>
              </div>
              <div className="relative">
                <Input
                  id="eth-amount"
                  type="number"
                  placeholder="0.0"
                  value={ethAmount}
                  onChange={(e) => {
                    setEthAmount(e.target.value)
                    if (liquidityMode === "balanced" && currentPrice && e.target.value) {
                      const tokenAmt = Number(e.target.value) * Number(currentPrice)
                      setTokenAmount(tokenAmt.toFixed(6))
                    }
                  }}
                  className="text-lg h-14 bg-background/50 border-border/50 focus:border-primary/50 pr-16"
                  disabled={!poolExists}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  ETH
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePercentageClick(pct, true)}
                    disabled={!poolExists || ethBalance === 0n}
                    className="h-9 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="token-amount" className="text-sm font-medium">
                  {tokenSymbol || "Token"} Amount
                </Label>
                <span className="text-xs text-muted-foreground">
                  Balance: {formatUnits(tokenBalance, 18).slice(0, 8)}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="token-amount"
                  type="number"
                  placeholder="0.0"
                  value={tokenAmount}
                  onChange={(e) => {
                    setTokenAmount(e.target.value)
                    if (liquidityMode === "balanced" && currentPrice && e.target.value) {
                      const ethAmt = Number(e.target.value) / Number(currentPrice)
                      setEthAmount(ethAmt.toFixed(6))
                    }
                  }}
                  className="text-lg h-14 bg-background/50 border-border/50 focus:border-primary/50 pr-20"
                  disabled={!poolExists || (liquidityMode === "balanced" && !!ethAmount)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground truncate max-w-[80px]">
                  {tokenSymbol || "TOKEN"}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePercentageClick(pct, false)}
                    disabled={!poolExists || tokenBalance === 0n || liquidityMode === "balanced"}
                    className="h-9 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between h-11 bg-muted/30 hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Advanced Settings
              </span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50 animate-in slide-in-from-top-2">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <Tabs value={priceRangeMode} onValueChange={(v) => setPriceRangeMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-10">
                      <TabsTrigger value="full" className="text-xs">
                        Full Range
                      </TabsTrigger>
                      <TabsTrigger value="concentrated" className="text-xs">
                        Concentrated
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {priceRangeMode === "concentrated" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="min-price" className="text-xs">
                          Min Price
                        </Label>
                        <Input
                          id="min-price"
                          type="number"
                          placeholder="0.0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="h-10 text-sm"
                          step="0.000001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-price" className="text-xs">
                          Max Price
                        </Label>
                        <Input
                          id="max-price"
                          type="number"
                          placeholder="0.0"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="h-10 text-sm"
                          step="0.000001"
                        />
                      </div>
                    </div>

                    {currentPrice && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <span>Current Price:</span>
                        <span className="font-medium text-foreground">{currentPrice} ETH</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <p>
                        Concentrated liquidity earns more fees but requires active management. Your position will only
                        earn fees when the price is within your range.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              {priceRangeMode === "full"
                ? `This will add liquidity across the full price range. You'll earn ${(feeTier / 10000).toFixed(2)}% fees from all trades in this pool.`
                : `Concentrated liquidity provides higher capital efficiency. You'll earn ${(feeTier / 10000).toFixed(2)}% fees only when the price is within your specified range.`}
              {liquidityMode === "custom" && " Custom ratios allow you to provide unbalanced liquidity."}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAddLiquidity}
              disabled={!ethAmount || !tokenAmount || !poolExists || isAddingLiquidity}
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
              disabled={isAddingLiquidity || isCreatingPool}
              className="h-12 bg-background/50"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Fee</span>
              <span className="font-medium">{(feeTier / 10000).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Range</span>
              <span className="font-medium">
                {priceRangeMode === "full" ? "Full Range" : `${minPrice || "?"} - ${maxPrice || "?"}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Liquidity Mode</span>
              <span className="font-medium capitalize">
                {liquidityMode === "balanced" ? "Balanced (50/50)" : "Custom Ratio"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Base</span>
            </div>
            {poolExists && poolAddress !== "v4-pool" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool Address</span>
                <a
                  href={`https://basescan.org/address/${poolAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
