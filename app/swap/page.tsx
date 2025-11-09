"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
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
  ArrowDown,
  ChevronDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()
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
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
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
        toast({
          title: "Gasless Swap",
          description: "Please sign the authorization in your wallet...",
        })

        const signedAuth = await signTransferAuthorization(
          process.env.NEXT_PUBLIC_RELAYER_ADDRESS as `0x${string}`,
          amountInParsed,
          0n,
          BigInt(Math.floor(Date.now() / 1000) + 3600),
        )

        toast({
          title: "Submitting Swap",
          description: "Relayer is executing your swap...",
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

        toast({
          title: "Gasless Swap Successful!",
          description: `Swapped ${inputAmount} USDC for ${Number.parseFloat(outputAmount).toFixed(2)} $USI with no gas fees!`,
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
        toast({
          title: "Approval Required",
          description: "Please approve USDC spending in your wallet...",
        })

        const approveHash = await writeContractAsync({
          address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS] as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [UNISWAP_V3_ROUTER[chainId as keyof typeof UNISWAP_V3_ROUTER] as `0x${string}`, amountInParsed],
        })

        console.log("[v0] USDC approval tx:", approveHash)

        toast({
          title: "Approval Confirmed",
          description: "USDC spending approved. Now executing swap...",
        })

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      toast({
        title: "Swap Pending",
        description: "Please confirm the swap in your wallet...",
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

      toast({
        title: "Swap Successful!",
        description: `Successfully swapped ${inputAmount} ${activeTab === "eth" ? "ETH" : "USDC"} for ${Number.parseFloat(outputAmount).toFixed(2)} $USI`,
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

      toast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(220,38,38,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        <div className="container relative mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />
              <div className="relative rounded-full bg-black border border-primary/30 p-8 backdrop-blur-xl">
                <Wallet className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Connect Your Wallet
              </h1>
              <p className="text-lg text-white/60 leading-relaxed">
                Connect your wallet to access premium token swapping with live liquidity and real-time pricing.
              </p>
            </div>
            <Button
              onClick={connect}
              size="lg"
              className="gap-2 h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 shadow-[0_0_50px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_60px_rgba(220,38,38,0.5)]"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const ethBalanceFormatted = ethBalance ? formatUnits(ethBalance.value, 18) : "0"
  const usdcBalanceFormatted = usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"
  const usiBalanceFormatted = usiBalance ? formatUnits(usiBalance as bigint, 18) : "0"

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.15),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.1),transparent_40%),radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="container relative mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Live Uniswap V3 Pricing</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-[1.1]">
              Token Swap
            </h1>
            <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
              Exchange ETH or USDC for $USI with institutional-grade execution and minimal slippage on Base network
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="group relative rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl transition-all hover:bg-white/[0.07] hover:border-white/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/50">ETH Balance</span>
                <div className="rounded-full bg-white/10 px-2 py-1">
                  <span className="text-xs font-mono text-white/70">18 decimals</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {Number.parseFloat(ethBalanceFormatted).toFixed(4)}
                </span>
                <span className="text-sm font-medium text-white/50">ETH</span>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl transition-all hover:bg-white/[0.07] hover:border-white/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/50">USDC Balance</span>
                <div className="rounded-full bg-white/10 px-2 py-1">
                  <span className="text-xs font-mono text-white/70">6 decimals</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {Number.parseFloat(usdcBalanceFormatted).toFixed(2)}
                </span>
                <span className="text-sm font-medium text-white/50">USDC</span>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 backdrop-blur-xl transition-all hover:border-primary/50">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/50">$USI Balance</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary tracking-tight">
                  {Number.parseFloat(usiBalanceFormatted).toFixed(2)}
                </span>
                <span className="text-sm font-medium text-primary/70">$USI</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="rounded-full bg-primary/20 p-2">
                      <ArrowDownUp className="h-5 w-5 text-primary" />
                    </div>
                    Swap Tokens
                  </h2>
                  <p className="text-sm text-white/50">Powered by Uniswap V3 on Base</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  <Settings className="h-4 w-4 text-white/70" />
                </Button>
              </div>

              {/* Gasless Mode Banner */}
              {activeTab === "usdc" && gaslessEligible && (
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/20 p-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Gasless Mode Available</p>
                        <p className="text-xs text-white/60">{remainingGaslessSwaps} free swaps remaining this month</p>
                      </div>
                    </div>
                    <Switch
                      checked={gaslessMode}
                      onCheckedChange={setGaslessMode}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {showSettings && (
                <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="slippage" className="text-sm font-medium text-white/90">
                      Slippage Tolerance
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="slippage"
                        type="number"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                      />
                      <div className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 text-sm font-medium text-white/70">
                        %
                      </div>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Your transaction will revert if the price changes unfavorably by more than this percentage.
                    </p>
                  </div>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "eth" | "usdc")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/5 border border-white/10 p-1">
                  <TabsTrigger
                    value="eth"
                    className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/60"
                  >
                    ETH → $USI
                  </TabsTrigger>
                  <TabsTrigger
                    value="usdc"
                    className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/60"
                  >
                    USDC → $USI
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="eth" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <Label htmlFor="eth-input" className="text-sm font-medium text-white/70">
                      You Pay
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur" />
                      <div className="relative rounded-2xl bg-white/5 border border-white/10 p-5">
                        <div className="flex items-center gap-3">
                          <Input
                            id="eth-input"
                            type="number"
                            placeholder="0.00"
                            value={inputAmount}
                            onChange={(e) => setInputAmount(e.target.value)}
                            className="flex-1 bg-transparent border-0 text-3xl font-bold text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                          />
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 border border-white/10">
                              <span className="text-base font-semibold text-white">ETH</span>
                              <ChevronDown className="h-4 w-4 text-white/50" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInputAmount((Number.parseFloat(ethBalanceFormatted) * 0.99).toFixed(6))}
                              className="h-9 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold"
                            >
                              MAX
                            </Button>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-white/40">
                          Balance: {Number.parseFloat(ethBalanceFormatted).toFixed(4)} ETH
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="rounded-full bg-white/10 border border-white/20 p-2.5 backdrop-blur-xl">
                      <ArrowDown className="h-5 w-5 text-white/70" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="usi-output" className="text-sm font-medium text-white/70">
                      You Receive
                    </Label>
                    <div className="relative">
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <div className="flex items-center gap-3">
                          <Input
                            id="usi-output"
                            type="text"
                            placeholder="0.00"
                            value={outputAmount}
                            readOnly
                            className="flex-1 bg-transparent border-0 text-3xl font-bold text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                          />
                          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2.5 border border-primary/30">
                            <span className="text-base font-semibold text-primary">$USI</span>
                            <ChevronDown className="h-4 w-4 text-primary/50" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status indicators */}
                    {isQuoteLoading && (
                      <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                        <span className="text-xs text-blue-300">Fetching live price from Uniswap V3...</span>
                      </div>
                    )}

                    {quoteError && (
                      <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium text-amber-300">{quoteError}</p>
                          <p className="text-xs text-amber-400/70 leading-relaxed">
                            To enable swaps, liquidity needs to be added to a Uniswap V3 pool. You can add liquidity on{" "}
                            <a
                              href="https://app.uniswap.org/add"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-amber-300"
                            >
                              Uniswap
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                    {availablePool && !quoteError && (
                      <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-medium text-green-300">
                          Pool found with {(availablePool.fee / 10000).toFixed(2)}% fee
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="usdc" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <Label htmlFor="usdc-input" className="text-sm font-medium text-white/70">
                      You Pay
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur" />
                      <div className="relative rounded-2xl bg-white/5 border border-white/10 p-5">
                        <div className="flex items-center gap-3">
                          <Input
                            id="usdc-input"
                            type="number"
                            placeholder="0.00"
                            value={inputAmount}
                            onChange={(e) => setInputAmount(e.target.value)}
                            className="flex-1 bg-transparent border-0 text-3xl font-bold text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                          />
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 border border-white/10">
                              <span className="text-base font-semibold text-white">USDC</span>
                              <ChevronDown className="h-4 w-4 text-white/50" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInputAmount(usdcBalanceFormatted)}
                              className="h-9 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold"
                            >
                              MAX
                            </Button>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-white/40">
                          Balance: {Number.parseFloat(usdcBalanceFormatted).toFixed(2)} USDC
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="rounded-full bg-white/10 border border-white/20 p-2.5 backdrop-blur-xl">
                      <ArrowDown className="h-5 w-5 text-white/70" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="usi-output-usdc" className="text-sm font-medium text-white/70">
                      You Receive
                    </Label>
                    <div className="relative">
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <div className="flex items-center gap-3">
                          <Input
                            id="usi-output-usdc"
                            type="text"
                            placeholder="0.00"
                            value={outputAmount}
                            readOnly
                            className="flex-1 bg-transparent border-0 text-3xl font-bold text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                          />
                          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2.5 border border-primary/30">
                            <span className="text-base font-semibold text-primary">$USI</span>
                            <ChevronDown className="h-4 w-4 text-primary/50" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {isQuoteLoading && (
                      <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                        <span className="text-xs text-blue-300">Fetching live price from Uniswap V3...</span>
                      </div>
                    )}

                    {quoteError && (
                      <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium text-amber-300">{quoteError}</p>
                          <p className="text-xs text-amber-400/70 leading-relaxed">
                            To enable swaps, liquidity needs to be added to a Uniswap V3 pool. You can add liquidity on{" "}
                            <a
                              href="https://app.uniswap.org/add"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-amber-300"
                            >
                              Uniswap
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                    {availablePool && !quoteError && (
                      <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-medium text-green-300">
                          Pool found with {(availablePool.fee / 10000).toFixed(2)}% fee
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {outputAmount && realQuote && !quoteError && availablePool && (
                <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">Exchange Rate</span>
                    <span className="text-sm font-semibold text-white">
                      1 {activeTab === "eth" ? "ETH" : "USDC"} ≈{" "}
                      {(Number.parseFloat(outputAmount) / Number.parseFloat(inputAmount)).toFixed(2)} $USI
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">Price Impact</span>
                    <span
                      className={`text-sm font-semibold ${Number.parseFloat(priceImpact) > 5 ? "text-red-400" : "text-green-400"}`}
                    >
                      {priceImpact}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">Minimum Received</span>
                    <span className="text-sm font-semibold text-white">
                      {(Number.parseFloat(outputAmount) * (1 - Number.parseFloat(slippage) / 100)).toFixed(6)} $USI
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">Uniswap Fee</span>
                    <span className="text-sm font-semibold text-white">{(availablePool.fee / 10000).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-sm text-white/50">Network Fee (Base)</span>
                    <span className="text-sm font-semibold text-green-400">~${estimatedGas}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSwap}
                className="w-full mt-6 h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/70 shadow-[0_0_40px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing Authorization...
                  </>
                ) : isQuoteLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Checking Liquidity Pools...
                  </>
                ) : quoteError ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    No Liquidity Available
                  </>
                ) : gaslessMode ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Swap Gasless
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Execute Swap
                  </>
                )}
              </Button>

              {/* Info Banner */}
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300/90 leading-relaxed">
                  {gaslessMode
                    ? "Gasless mode: Sign once and we'll execute the swap for you with no gas fees. You only pay for the tokens."
                    : "Swaps use live on-chain data from Uniswap V3 on Base network. Enable Gasless Mode for USDC swaps to avoid gas fees."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-full bg-primary/20 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white">$USI Token Info</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Contract</span>
                  <a
                    href={`https://basescan.org/token/${USI_TOKEN_ADDRESS[8453]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Network</span>
                  <span className="text-sm font-semibold text-white">Base</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">DEX</span>
                  <span className="text-sm font-semibold text-white">Uniswap V3</span>
                </div>
                <div className="pt-4 border-t border-primary/20">
                  <p className="text-xs text-white/50 leading-relaxed">
                    $USI is the native token of the ANTI music platform. Use it for payments, staking, and governance.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-6">Why Swap to $USI?</h3>
              <div className="space-y-4">
                {[
                  "Get 10% discount on music streaming payments",
                  "Stake to earn platform fees",
                  "Vote on platform governance",
                  "Access exclusive features and drops",
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed pt-0.5">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Swaps</h2>
            <p className="text-sm text-white/50 mt-1">Your swap transaction history</p>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/30" />
            </div>
          ) : swapHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="rounded-full bg-white/5 p-6 w-fit mx-auto mb-4">
                <ArrowDownUp className="h-12 w-12 text-white/20" />
              </div>
              <p className="text-white/50 mb-1">No swap history yet</p>
              <p className="text-sm text-white/30">Your swaps will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {swapHistory.map((swap) => (
                <div
                  key={swap.id}
                  className="group flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/[0.07] hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/20 p-3">
                      <ArrowDownUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {swap.token_in} → {swap.token_out}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(swap.created_at).toLocaleDateString()} at{" "}
                        {new Date(swap.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {Number.parseFloat(swap.amount_in).toFixed(4)} {swap.token_in}
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      → {Number.parseFloat(swap.amount_out).toFixed(2)} {swap.token_out}
                    </p>
                    {swap.tx_hash && (
                      <a
                        href={`https://basescan.org/tx/${swap.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
                      >
                        View tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
