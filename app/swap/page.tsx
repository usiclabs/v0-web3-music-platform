"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowDownUp,
  Loader2,
  ExternalLink,
  TrendingUp,
  Wallet,
  Settings,
  Info,
  Zap,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import {
  USDC_ADDRESS,
  USI_TOKEN_ADDRESS,
  ERC20_ABI,
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
} from "@/lib/web3/contracts"
import { useReadContract, useWriteContract, useBalance } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { createClient } from "@/lib/supabase/client"
import confetti from "canvas-confetti"
import { useEIP3009 } from "@/lib/web3/use-eip3009"
import { checkGaslessSwapEligibility } from "@/lib/swap/gasless-swap"
import { Switch } from "@/components/ui/switch"

const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006", // WETH on Base
  84532: "0x4200000000000000000000000000000000000006", // WETH on Base Sepolia
} as const

interface SwapHistory {
  id: string
  user_address: string
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string
  tx_hash: string | null
  created_at: string
}

export default function SwapPage() {
  const { address, isConnected, chainId, connect } = useWallet()
  const { addToast } = useToast()
  const [inputAmount, setInputAmount] = useState("")
  const [outputAmount, setOutputAmount] = useState("")
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [showSettings, setShowSettings] = useState(false)
  const [swapHistory, setSwapHistory] = useState<SwapHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<"eth" | "usdc">("usdc") // Default to USDC for gasless
  const [estimatedGas, setEstimatedGas] = useState<string>("0.01")
  const [priceImpact, setPriceImpact] = useState<string>("0")
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [realQuote, setRealQuote] = useState<bigint | null>(null)
  const [availablePool, setAvailablePool] = useState<{ address: string; fee: number } | null>(null)
  const [isCheckingPools, setIsCheckingPools] = useState(false)

  const [gaslessMode, setGaslessMode] = useState(false)
  const [gaslessEligible, setGaslessEligible] = useState(false)
  const [remainingGaslessSwaps, setRemainingGaslessSwaps] = useState(0)
  const { signTransferAuthorization, isSigning } = useEIP3009()

  const { data: ethBalance } = useBalance({
    address: address,
    query: { enabled: isConnected },
  })

  const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
    address: chainId ? USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS] : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!chainId },
  })

  const { data: usiBalance, refetch: refetchUSI } = useReadContract({
    address: chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!chainId },
  })

  const { writeContractAsync } = useWriteContract()

  const tokenIn =
    activeTab === "eth" && chainId
      ? WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]
      : chainId
        ? USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]
        : undefined
  const tokenOut = chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : undefined
  const amountIn =
    inputAmount && Number.parseFloat(inputAmount) > 0
      ? parseUnits(inputAmount, activeTab === "eth" ? 18 : 6)
      : undefined

  const feeTiers = [500, 3000, 10000] // 0.05%, 0.3%, 1%

  const { data: pool500 } = useReadContract({
    address: chainId ? UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] : undefined,
    abi: UNISWAP_V3_FACTORY_ABI,
    functionName: "getPool",
    args: tokenIn && tokenOut ? [tokenIn as `0x${string}`, tokenOut as `0x${string}`, 500] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut && !!chainId },
  })

  const { data: pool3000 } = useReadContract({
    address: chainId ? UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] : undefined,
    abi: UNISWAP_V3_FACTORY_ABI,
    functionName: "getPool",
    args: tokenIn && tokenOut ? [tokenIn as `0x${string}`, tokenOut as `0x${string}`, 3000] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut && !!chainId },
  })

  const { data: pool10000 } = useReadContract({
    address: chainId ? UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] : undefined,
    abi: UNISWAP_V3_FACTORY_ABI,
    functionName: "getPool",
    args: tokenIn && tokenOut ? [tokenIn as `0x${string}`, tokenOut as `0x${string}`, 10000] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut && !!chainId },
  })

  useEffect(() => {
    const zeroAddress = "0x0000000000000000000000000000000000000000"

    if (pool500 && pool500 !== zeroAddress) {
      setAvailablePool({ address: pool500 as string, fee: 500 })
      console.log("[v0] Found pool with 0.05% fee:", pool500)
    } else if (pool3000 && pool3000 !== zeroAddress) {
      setAvailablePool({ address: pool3000 as string, fee: 3000 })
      console.log("[v0] Found pool with 0.3% fee:", pool3000)
    } else if (pool10000 && pool10000 !== zeroAddress) {
      setAvailablePool({ address: pool10000 as string, fee: 10000 })
      console.log("[v0] Found pool with 1% fee:", pool10000)
    } else {
      setAvailablePool(null)
      console.log("[v0] No liquidity pool found for this token pair")
    }
  }, [pool500, pool3000, pool10000])

  const {
    data: quoteData,
    isLoading: isQuoteLoading,
    error: quoteErrorData,
    refetch: refetchQuote,
  } = useReadContract({
    address: chainId ? UNISWAP_V3_QUOTER[chainId as keyof typeof UNISWAP_V3_QUOTER] : undefined,
    abi: UNISWAP_V3_QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args:
      tokenIn && tokenOut && amountIn && availablePool
        ? [
            {
              tokenIn: tokenIn as `0x${string}`,
              tokenOut: tokenOut as `0x${string}`,
              amountIn: amountIn,
              fee: availablePool.fee,
              sqrtPriceLimitX96: 0n,
            },
          ]
        : undefined,
    query: {
      enabled: !!tokenIn && !!tokenOut && !!amountIn && !!chainId && !!availablePool,
    },
  })

  useEffect(() => {
    console.log("[v0] Quote data updated:", {
      quoteData,
      isQuoteLoading,
      quoteErrorData,
      inputAmount,
      activeTab,
      availablePool,
    })

    if (!availablePool && inputAmount && Number.parseFloat(inputAmount) > 0) {
      setQuoteError(
        "No Uniswap V3 liquidity pool exists for this token pair. The $USI token may need liquidity to be added first.",
      )
      setOutputAmount("")
      setRealQuote(null)
      return
    }

    if (quoteErrorData) {
      console.error("[v0] Quote error:", quoteErrorData)
      setQuoteError("Unable to fetch price quote. Please try again or adjust the amount.")
      setOutputAmount("")
      setRealQuote(null)
      return
    }

    if (quoteData && Array.isArray(quoteData) && quoteData[0]) {
      const amountOut = quoteData[0] as bigint
      const formattedOutput = formatUnits(amountOut, 18)
      setOutputAmount(formattedOutput)
      setRealQuote(amountOut)
      setQuoteError(null)

      if (inputAmount && Number.parseFloat(inputAmount) > 0 && availablePool) {
        // Base price impact is the pool fee
        const poolFeePercent = availablePool.fee / 10000 // Convert basis points to percentage

        // For larger trades, estimate additional impact based on trade size
        // This is a simplified approximation - real impact depends on pool liquidity
        const inputValue = Number.parseFloat(inputAmount)
        let additionalImpact = 0

        if (activeTab === "eth" && inputValue > 1) {
          // For ETH swaps > 1 ETH, add ~0.1% per ETH
          additionalImpact = (inputValue - 1) * 0.1
        } else if (activeTab === "usdc" && inputValue > 1000) {
          // For USDC swaps > 1000 USDC, add ~0.1% per 1000 USDC
          additionalImpact = ((inputValue - 1000) / 1000) * 0.1
        }

        const totalImpact = poolFeePercent + additionalImpact
        setPriceImpact(totalImpact.toFixed(2))
      }

      console.log("[v0] Quote successful:", {
        amountOut: amountOut.toString(),
        formatted: formattedOutput,
        fee: availablePool?.fee,
      })
    } else if (!inputAmount || Number.parseFloat(inputAmount) <= 0) {
      setOutputAmount("")
      setRealQuote(null)
      setQuoteError(null)
    }
  }, [quoteData, quoteErrorData, isQuoteLoading, inputAmount, activeTab, availablePool])

  useEffect(() => {
    const checkEligibility = async () => {
      if (address && activeTab === "usdc") {
        const result = await checkGaslessSwapEligibility(address as `0x${string}`)
        setGaslessEligible(result.eligible)
        setRemainingGaslessSwaps(result.remainingSwaps)
      }
    }
    checkEligibility()
  }, [address, activeTab])

  useEffect(() => {
    if (activeTab === "eth") {
      setGaslessMode(false)
    }
  }, [activeTab])

  const loadSwapHistory = async () => {
    if (!address) return

    setIsLoadingHistory(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("swap_history")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        if (error.message?.includes("Could not find the table")) {
          // Table doesn't exist yet - this is expected until migration is run
          setSwapHistory([])
          return
        }
        console.error("[v0] Failed to load swap history:", error)
        return
      }
      setSwapHistory(data || [])
    } catch (error: any) {
      if (!error.message?.includes("Could not find the table")) {
        console.error("[v0] Failed to load swap history:", error)
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSwap = async () => {
    if (!address || !chainId || !inputAmount || !outputAmount || !realQuote || !availablePool) return

    const amount = Number.parseFloat(inputAmount)
    if (isNaN(amount) || amount <= 0) {
      addToast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "error",
      })
      return
    }

    try {
      const tokenInAddress =
        activeTab === "eth"
          ? WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]
          : USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]
      const tokenOutAddress = USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS]
      const amountInParsed = parseUnits(inputAmount, activeTab === "eth" ? 18 : 6)
      const slippagePercent = Number.parseFloat(slippage)
      const minAmountOut = (realQuote * BigInt(Math.floor((1 - slippagePercent / 100) * 10000))) / 10000n

      console.log("[v0] Preparing swap:", {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountInParsed.toString(),
        minAmountOut: minAmountOut.toString(),
        slippage: slippagePercent,
        fee: availablePool.fee,
        gaslessMode,
      })

      if (gaslessMode && activeTab === "usdc") {
        addToast({
          title: "Gasless Swap",
          description: "Please sign the authorization in your wallet...",
          variant: "default",
        })

        const signedAuth = await signTransferAuthorization(
          process.env.NEXT_PUBLIC_RELAYER_ADDRESS as `0x${string}`,
          amountInParsed,
          0n,
          BigInt(Math.floor(Date.now() / 1000) + 3600),
        )

        addToast({
          title: "Submitting Swap",
          description: "Relayer is executing your swap...",
          variant: "default",
        })

        const response = await fetch("/api/eip3009/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorization: {
              from: signedAuth.authorization.from,
              to: signedAuth.authorization.to,
              value: signedAuth.authorization.value.toString(),
              validAfter: Number(signedAuth.authorization.validAfter),
              validBefore: Number(signedAuth.authorization.validBefore),
              nonce: signedAuth.authorization.nonce,
            },
            signature: {
              v: signedAuth.v,
              r: signedAuth.r,
              s: signedAuth.s,
            },
            metadata: {
              purpose: "gasless_swap",
              swapParams: {
                tokenIn: "USDC",
                tokenOut: "USI",
                amountIn: amountInParsed.toString(),
                minAmountOut: minAmountOut.toString(),
                slippage: slippagePercent,
                poolFee: availablePool.fee,
              },
            },
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Gasless swap failed")
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5", "#ffffff"],
          ticks: 200,
          gravity: 1.2,
          scalar: 1.2,
        })

        addToast({
          title: "Gasless Swap Successful!",
          description: `Swapped ${inputAmount} USDC for ${Number.parseFloat(outputAmount).toFixed(2)} $USI with no gas fees!`,
          variant: "success",
        })

        setInputAmount("")
        setOutputAmount("")
        setRealQuote(null)
        refetchUSDC()
        refetchUSI()
        loadSwapHistory()

        // Update gasless eligibility
        const eligibility = await checkGaslessSwapEligibility(address as `0x${string}`)
        setGaslessEligible(eligibility.eligible)
        setRemainingGaslessSwaps(eligibility.remainingSwaps)

        return
      }

      if (activeTab === "usdc") {
        addToast({
          title: "Approval Required",
          description: "Please approve USDC spending in your wallet...",
          variant: "default",
        })

        const approveHash = await writeContractAsync({
          address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS] as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [UNISWAP_V3_ROUTER[chainId as keyof typeof UNISWAP_V3_ROUTER] as `0x${string}`, amountInParsed],
        })

        console.log("[v0] USDC approval tx:", approveHash)

        addToast({
          title: "Approval Confirmed",
          description: "USDC spending approved. Now executing swap...",
          variant: "success",
        })

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      addToast({
        title: "Swap Pending",
        description: "Please confirm the swap in your wallet...",
        variant: "default",
      })

      const swapHash = await writeContractAsync({
        address: UNISWAP_V3_ROUTER[chainId as keyof typeof UNISWAP_V3_ROUTER] as `0x${string}`,
        abi: UNISWAP_V3_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: tokenInAddress as `0x${string}`,
            tokenOut: tokenOutAddress as `0x${string}`,
            fee: availablePool.fee,
            recipient: address,
            amountIn: amountInParsed,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,
          },
        ],
        value: activeTab === "eth" ? amountInParsed : 0n,
      })

      console.log("[v0] Swap tx:", swapHash)

      const supabase = createClient()
      try {
        await supabase.from("swap_history").insert({
          user_address: address.toLowerCase(),
          token_in: activeTab === "eth" ? "ETH" : "USDC",
          token_out: "USI",
          amount_in: inputAmount,
          amount_out: outputAmount,
          tx_hash: swapHash,
        })
      } catch (historyError: any) {
        // Don't fail the swap if history insert fails
        if (!historyError.message?.includes("Could not find the table")) {
          console.error("[v0] Failed to save swap history:", historyError)
        }
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5", "#ffffff"],
        ticks: 200,
        gravity: 1.2,
        scalar: 1.2,
      })

      addToast({
        title: "Swap Successful!",
        description: `Successfully swapped ${inputAmount} ${activeTab === "eth" ? "ETH" : "USDC"} for ${Number.parseFloat(outputAmount).toFixed(2)} $USI`,
        variant: "success",
      })

      setInputAmount("")
      setOutputAmount("")
      setRealQuote(null)
      refetchUSDC()
      refetchUSI()
      loadSwapHistory()
    } catch (error: any) {
      console.error("[v0] Swap failed:", error)

      let errorMessage = "Failed to execute swap."
      if (error.message?.includes("User rejected")) {
        errorMessage = "Transaction was rejected in your wallet."
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for this swap."
      } else if (error.message?.includes("Too little received")) {
        errorMessage = "Price moved unfavorably. Try increasing slippage tolerance."
      }

      addToast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "error",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground max-w-md">
              Connect your wallet to swap ETH and USDC for $USI tokens on Base network.
            </p>
          </div>
          <Button onClick={connect} size="lg" className="gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  const ethBalanceFormatted = ethBalance ? formatUnits(ethBalance.value, 18) : "0"
  const usdcBalanceFormatted = usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"
  const usiBalanceFormatted = usiBalance ? formatUnits(usiBalance as bigint, 18) : "0"

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Swap to $USI</h1>
        <p className="text-muted-foreground">Swap ETH or USDC for $USI tokens on Base network via Uniswap V3</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ETH Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{Number.parseFloat(ethBalanceFormatted).toFixed(4)}</span>
              <span className="text-sm text-muted-foreground">ETH</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">USDC Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{Number.parseFloat(usdcBalanceFormatted).toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">USDC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">$USI Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {Number.parseFloat(usiBalanceFormatted).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">$USI</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swap Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownUp className="h-5 w-5 text-primary" />
                    Swap Tokens
                  </CardTitle>
                  <CardDescription>Exchange ETH or USDC for $USI tokens</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === "usdc" && gaslessEligible && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Gasless Mode</p>
                      <p className="text-xs text-muted-foreground">{remainingGaslessSwaps} free swaps remaining</p>
                    </div>
                  </div>
                  <Switch checked={gaslessMode} onCheckedChange={setGaslessMode} />
                </div>
              )}

              {/* Settings Panel */}
              {showSettings && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="slippage" className="text-sm">
                      Slippage Tolerance
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="slippage"
                        type="number"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="flex-1"
                      />
                      <span className="flex items-center text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your transaction will revert if the price changes unfavorably by more than this percentage.
                    </p>
                  </div>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "eth" | "usdc")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="eth">ETH → $USI</TabsTrigger>
                  <TabsTrigger value="usdc">USDC → $USI</TabsTrigger>
                </TabsList>

                <TabsContent value="eth" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="eth-input">You Pay</Label>
                    <div className="relative">
                      <Input
                        id="eth-input"
                        type="number"
                        placeholder="0.0"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        className="pr-20 text-lg h-14"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="font-semibold">ETH</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInputAmount((Number.parseFloat(ethBalanceFormatted) * 0.99).toFixed(6))}
                          className="h-7 text-xs"
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balance: {Number.parseFloat(ethBalanceFormatted).toFixed(4)} ETH
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-2">
                      <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usi-output">You Receive</Label>
                    <div className="relative">
                      <Input
                        id="usi-output"
                        type="text"
                        placeholder="0.0"
                        value={outputAmount}
                        readOnly
                        className="pr-16 text-lg h-14 bg-muted/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="font-semibold text-primary">$USI</span>
                      </div>
                    </div>
                    {isQuoteLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Fetching live price from Uniswap V3...</span>
                      </div>
                    )}
                    {quoteError && (
                      <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded p-3">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">{quoteError}</p>
                          <p className="text-xs">
                            To enable swaps, liquidity needs to be added to a Uniswap V3 pool for this token pair. You
                            can add liquidity on{" "}
                            <a
                              href="https://app.uniswap.org/add"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-amber-700"
                            >
                              Uniswap
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    )}
                    {availablePool && !quoteError && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Pool found with {(availablePool.fee / 10000).toFixed(2)}% fee</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="usdc" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="usdc-input">You Pay</Label>
                    <div className="relative">
                      <Input
                        id="usdc-input"
                        type="number"
                        placeholder="0.0"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        className="pr-20 text-lg h-14"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="font-semibold">USDC</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInputAmount(usdcBalanceFormatted)}
                          className="h-7 text-xs"
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balance: {Number.parseFloat(usdcBalanceFormatted).toFixed(2)} USDC
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-2">
                      <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usi-output-usdc">You Receive</Label>
                    <div className="relative">
                      <Input
                        id="usi-output-usdc"
                        type="text"
                        placeholder="0.0"
                        value={outputAmount}
                        readOnly
                        className="pr-16 text-lg h-14 bg-muted/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="font-semibold text-primary">$USI</span>
                      </div>
                    </div>
                    {isQuoteLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Fetching live price from Uniswap V3...</span>
                      </div>
                    )}
                    {quoteError && (
                      <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded p-3">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">{quoteError}</p>
                          <p className="text-xs">
                            To enable swaps, liquidity needs to be added to a Uniswap V3 pool for this token pair. You
                            can add liquidity on{" "}
                            <a
                              href="https://app.uniswap.org/add"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-amber-700"
                            >
                              Uniswap
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    )}
                    {availablePool && !quoteError && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Pool found with {(availablePool.fee / 10000).toFixed(2)}% fee</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {outputAmount && realQuote && !quoteError && availablePool && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate (Live from Uniswap)</span>
                    <span className="font-medium">
                      1 {activeTab === "eth" ? "ETH" : "USDC"} ≈{" "}
                      {(Number.parseFloat(outputAmount) / Number.parseFloat(inputAmount)).toFixed(2)} $USI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span
                      className={`font-medium ${Number.parseFloat(priceImpact) > 5 ? "text-red-500" : "text-green-500"}`}
                    >
                      {priceImpact}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Received</span>
                    <span className="font-medium">
                      {(Number.parseFloat(outputAmount) * (1 - Number.parseFloat(slippage) / 100)).toFixed(6)} $USI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Uniswap Fee ({(availablePool.fee / 10000).toFixed(2)}%)
                    </span>
                    <span className="font-medium">
                      {(Number.parseFloat(inputAmount) * (availablePool.fee / 1000000)).toFixed(6)}{" "}
                      {activeTab === "eth" ? "ETH" : "USDC"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee (Base)</span>
                    <span className="font-medium text-green-500">~${estimatedGas}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSwap}
                className="w-full"
                size="lg"
                disabled={
                  !inputAmount ||
                  !outputAmount ||
                  !realQuote ||
                  !availablePool ||
                  Number.parseFloat(inputAmount) <= 0 ||
                  isQuoteLoading ||
                  !!quoteError ||
                  isSigning
                }
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : isQuoteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking Pools...
                  </>
                ) : quoteError ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No Liquidity Pool Available
                  </>
                ) : gaslessMode ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Swap Gasless
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Swap Now
                  </>
                )}
              </Button>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>
                  {gaslessMode
                    ? "Gasless mode: Sign once and we'll execute the swap for you with no gas fees! You only pay for the tokens."
                    : "Swaps use live on-chain data from Uniswap V3 on Base network. Enable Gasless Mode for USDC swaps to avoid gas fees."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                $USI Token Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <a
                  href={`https://basescan.org/token/${USI_TOKEN_ADDRESS[8453]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">Base</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DEX</span>
                <span className="font-medium">Uniswap V3</span>
              </div>
              <div className="pt-2 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  $USI is the native token of the ANTI music platform. Use it for payments, staking, and governance.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why Swap to $USI?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="rounded-full bg-primary/10 p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-muted-foreground">Get 10% discount on music streaming payments</p>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full bg-primary/10 p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-muted-foreground">Stake to earn platform fees</p>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full bg-primary/10 p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-muted-foreground">Vote on platform governance</p>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full bg-primary/10 p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <p className="text-muted-foreground">Access exclusive features and drops</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Swap History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Swaps</CardTitle>
          <CardDescription>Your swap transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : swapHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowDownUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No swap history yet</p>
              <p className="text-sm">Your swaps will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {swapHistory.map((swap) => (
                <div
                  key={swap.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-primary/10 text-primary">
                      <ArrowDownUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {swap.token_in} → {swap.token_out}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(swap.created_at).toLocaleDateString()} at{" "}
                        {new Date(swap.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {Number.parseFloat(swap.amount_in).toFixed(4)} {swap.token_in}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      → {Number.parseFloat(swap.amount_out).toFixed(2)} {swap.token_out}
                    </p>
                    {swap.tx_hash && (
                      <a
                        href={`https://basescan.org/tx/${swap.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 justify-end"
                      >
                        View tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
