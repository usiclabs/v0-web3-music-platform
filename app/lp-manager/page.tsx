"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Droplet, Wallet, DollarSign, BarChart3, ArrowUpRight } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import {
  UNISWAP_V3_POSITION_MANAGER,
  UNISWAP_V3_POSITION_MANAGER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
  ERC20_ABI,
} from "@/lib/web3/contracts"
import { useReadContract, useWriteContract, usePublicClient } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import confetti from "canvas-confetti"
import { createClient } from "@/lib/supabase/client"

const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006",
  84532: "0x4200000000000000000000000000000000000006",
} as const

interface LiquidityPosition {
  tokenId: bigint
  token0: string
  token1: string
  fee: number
  liquidity: bigint
  tickLower: number
  tickUpper: number
  tokensOwed0: bigint
  tokensOwed1: bigint
  token0Amount?: bigint
  token1Amount?: bigint
  token0Metadata?: TokenMetadata
  token1Metadata?: TokenMetadata
  token0Price?: number
  token1Price?: number
  totalValueUSD?: number
  feesUSD?: number
}

interface TokenMetadata {
  address: string
  symbol: string
  name: string
  decimals: number
  image?: string
  priceUSD?: number
}

const tokenMetadataCache = new Map<string, TokenMetadata>()

export default function LPManagerPage() {
  const { address, isConnected, chainId, connect } = useWallet()
  const { addToast } = useToast()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [positions, setPositions] = useState<LiquidityPosition[]>([])
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)
  const [activeTab, setActiveTab] = useState<"positions" | "add" | "create">("positions")
  const [totalTVL, setTotalTVL] = useState(0)
  const [totalUnclaimedFees, setTotalUnclaimedFees] = useState(0)

  // Add Liquidity State
  const [token0Address, setToken0Address] = useState("")
  const [token1Address, setToken1Address] = useState("")
  const [feeTier, setFeeTier] = useState<500 | 3000 | 10000>(3000)
  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [priceRangeLow, setPriceRangeLow] = useState("")
  const [priceRangeHigh, setPriceRangeHigh] = useState("")
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)

  // Create Pool State
  const [createToken0, setCreateToken0] = useState("")
  const [createToken1, setCreateToken1] = useState("")
  const [createFeeTier, setCreateFeeTier] = useState<500 | 3000 | 10000>(3000)
  const [initialPrice, setInitialPrice] = useState("")
  const [isCreatingPool, setIsCreatingPool] = useState(false)

  // Tokenized tracks for quick selection
  const [tokenizedTracks, setTokenizedTracks] = useState<any[]>([])

  const { data: positionCount } = useReadContract({
    address: chainId ? UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] : undefined,
    abi: UNISWAP_V3_POSITION_MANAGER_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!chainId },
  })

  useEffect(() => {
    if (isConnected && positionCount) {
      loadPositions()
    }
  }, [isConnected, positionCount])

  useEffect(() => {
    loadTokenizedTracks()
  }, [])

  useEffect(() => {
    if (token0Address && token1Address && chainId) {
      checkPoolExists()
    }
  }, [token0Address, token1Address, feeTier, chainId])

  useEffect(() => {
    calculateTVLAndFees()
  }, [positions])

  const fetchTokenMetadata = async (tokenAddress: string): Promise<TokenMetadata> => {
    // Check cache first
    if (tokenMetadataCache.has(tokenAddress.toLowerCase())) {
      return tokenMetadataCache.get(tokenAddress.toLowerCase())!
    }

    if (!publicClient || !chainId) {
      throw new Error("Public client not available")
    }

    try {
      // Fetch basic token info from contract
      const [symbol, name, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: "symbol",
              outputs: [{ name: "", type: "string" }],
              stateMutability: "view",
              type: "function",
            },
          ] as const,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: "name",
              outputs: [{ name: "", type: "string" }],
              stateMutability: "view",
              type: "function",
            },
          ] as const,
          functionName: "name",
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: "decimals",
              outputs: [{ name: "", type: "uint8" }],
              stateMutability: "view",
              type: "function",
            },
          ] as const,
          functionName: "decimals",
        }),
      ])

      // Try to fetch image from database for tokenized tracks
      let image: string | undefined
      try {
        const supabase = createClient()
        const { data } = await supabase.from("tracks").select("cover_url").eq("coin_address", tokenAddress).single()

        if (data?.cover_url) {
          image = data.cover_url
        }
      } catch (error) {
        // No image found, use placeholder
        image = `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(symbol as string)}`
      }

      const metadata: TokenMetadata = {
        address: tokenAddress,
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
        image,
      }

      // Cache the metadata
      tokenMetadataCache.set(tokenAddress.toLowerCase(), metadata)

      return metadata
    } catch (error) {
      console.error(`[v0] Failed to fetch metadata for ${tokenAddress}:`, error)
      // Return minimal metadata
      return {
        address: tokenAddress,
        symbol: "???",
        name: "Unknown Token",
        decimals: 18,
        image: `/placeholder.svg?height=40&width=40&query=token`,
      }
    }
  }

  const fetchTokenPrice = async (tokenAddress: string): Promise<number> => {
    if (!publicClient || !chainId) return 0

    try {
      const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]

      // Try different fee tiers in order of likelihood
      const feeTiers = [3000, 500, 10000]

      for (const fee of feeTiers) {
        try {
          const poolAddress = await publicClient.readContract({
            address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
            abi: UNISWAP_V3_FACTORY_ABI,
            functionName: "getPool",
            args: [tokenAddress as `0x${string}`, wethAddress as `0x${string}`, fee],
          })

          if (poolAddress === "0x0000000000000000000000000000000000000000") continue

          // Get quote for 1 token (use proper decimals)
          const quote = await publicClient.readContract({
            address: UNISWAP_V3_QUOTER[chainId as keyof typeof UNISWAP_V3_QUOTER] as `0x${string}`,
            abi: UNISWAP_V3_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [
              {
                tokenIn: tokenAddress as `0x${string}`,
                tokenOut: wethAddress as `0x${string}`,
                amountIn: parseUnits("1", 18),
                fee,
                sqrtPriceLimitX96: 0n,
              },
            ],
          })

          if (quote && Array.isArray(quote) && quote[0]) {
            const wethAmount = Number(formatUnits(quote[0] as bigint, 18))
            // Assume ETH = $3000 (in production, fetch real ETH price from oracle)
            const ethPrice = 3000
            return wethAmount * ethPrice
          }
        } catch (error) {
          continue
        }
      }

      return 0
    } catch (error) {
      console.error(`[v0] Failed to fetch price for ${tokenAddress}:`, error)
      return 0
    }
  }

  const calculateTVLAndFees = () => {
    let tvl = 0
    let fees = 0

    for (const position of positions) {
      if (position.totalValueUSD) {
        tvl += position.totalValueUSD
      }
      if (position.feesUSD) {
        fees += position.feesUSD
      }
    }

    setTotalTVL(tvl)
    setTotalUnclaimedFees(fees)
  }

  const loadTokenizedTracks = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("tracks")
        .select("id, title, coin_address, artist_name, cover_url")
        .not("coin_address", "is", null)
        .limit(20)

      if (data) {
        setTokenizedTracks(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load tokenized tracks:", error)
    }
  }

  const checkPoolExists = async () => {
    if (!chainId || !publicClient || !token0Address || !token1Address) return

    setIsCheckingPool(true)
    try {
      const poolAddress = await publicClient.readContract({
        address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: "getPool",
        args: [token0Address as `0x${string}`, token1Address as `0x${string}`, feeTier],
      })

      setPoolExists(poolAddress !== "0x0000000000000000000000000000000000000000")
    } catch (error) {
      console.error("[v0] Failed to check pool:", error)
      setPoolExists(null)
    } finally {
      setIsCheckingPool(false)
    }
  }

  const loadPositions = async () => {
    if (!address || !chainId || !publicClient || !positionCount) return

    setIsLoadingPositions(true)
    try {
      const count = Number(positionCount)
      const loadedPositions: LiquidityPosition[] = []

      console.log(`[v0] Loading ${count} positions...`)

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

      const retryWithBackoff = async <T,>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn()
          } catch (error: any) {
            const isRateLimit = error?.message?.includes("rate limit") || error?.message?.includes("429")
            if (isRateLimit && i < maxRetries - 1) {
              const waitTime = baseDelay * Math.pow(2, i)
              console.log(`[v0] Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`)
              await delay(waitTime)
              continue
            }
            throw error
          }
        }
        throw new Error("Max retries exceeded")
      }

      for (let i = 0; i < count; i++) {
        if (i > 0) {
          await delay(500) // 500ms delay between requests
        }

        const tokenId = await retryWithBackoff(() =>
          publicClient.readContract({
            address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
            abi: UNISWAP_V3_POSITION_MANAGER_ABI,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          }),
        )

        const position = await retryWithBackoff(() =>
          publicClient.readContract({
            address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
            abi: UNISWAP_V3_POSITION_MANAGER_ABI,
            functionName: "positions",
            args: [tokenId as bigint],
          }),
        )

        if (position && Array.isArray(position)) {
          const pos: LiquidityPosition = {
            tokenId: tokenId as bigint,
            token0: position[2] as string,
            token1: position[3] as string,
            fee: position[4] as number,
            tickLower: position[5] as number,
            tickUpper: position[6] as number,
            liquidity: position[7] as bigint,
            tokensOwed0: position[10] as bigint,
            tokensOwed1: position[11] as bigint,
          }

          try {
            const [token0Meta, token1Meta, price0, price1] = await Promise.all([
              fetchTokenMetadata(pos.token0),
              fetchTokenMetadata(pos.token1),
              fetchTokenPrice(pos.token0),
              fetchTokenPrice(pos.token1),
            ])

            pos.token0Metadata = token0Meta
            pos.token1Metadata = token1Meta
            pos.token0Price = price0
            pos.token1Price = price1

            if (pos.liquidity > 0n) {
              // Simplified calculation: estimate token amounts from liquidity
              // In production, use proper Uniswap V3 math library for accurate calculation
              const liquidityValue = Number(pos.liquidity) / 1e18

              // Rough estimate: split liquidity value between both tokens
              // This is a simplification - actual calculation depends on current tick and price range
              const estimatedValue0 = (liquidityValue * price0) / 2
              const estimatedValue1 = (liquidityValue * price1) / 2

              pos.totalValueUSD = estimatedValue0 + estimatedValue1

              // If we have actual liquidity, the position has value even if tokensOwed is 0
              if (pos.totalValueUSD === 0 && pos.liquidity > 0n) {
                // Fallback: use a minimum estimated value based on liquidity
                pos.totalValueUSD = liquidityValue * 0.01 // Very rough estimate
              }
            }

            if (pos.tokensOwed0 > 0n || pos.tokensOwed1 > 0n) {
              const fees0 = Number(formatUnits(pos.tokensOwed0, token0Meta.decimals)) * price0
              const fees1 = Number(formatUnits(pos.tokensOwed1, token1Meta.decimals)) * price1
              pos.feesUSD = fees0 + fees1
            } else {
              pos.feesUSD = 0
            }

            console.log(`[v0] Position ${tokenId} loaded:`, {
              token0: token0Meta.symbol,
              token1: token1Meta.symbol,
              valueUSD: pos.totalValueUSD,
              feesUSD: pos.feesUSD,
            })
          } catch (error) {
            console.error(`[v0] Failed to enrich position ${tokenId}:`, error)
          }

          loadedPositions.push(pos)
        }
      }

      setPositions(loadedPositions)
      console.log(`[v0] Loaded ${loadedPositions.length} positions`)
    } catch (error) {
      console.error("[v0] Failed to load positions:", error)
      addToast({
        title: "Error",
        description: "Failed to load liquidity positions",
        variant: "error",
      })
    } finally {
      setIsLoadingPositions(false)
    }
  }

  const handleCreatePool = async () => {
    if (!address || !chainId || !createToken0 || !createToken1 || !initialPrice) return

    setIsCreatingPool(true)
    try {
      const price = Number.parseFloat(initialPrice)
      const sqrtPriceX96 = BigInt(Math.floor(Math.sqrt(price) * 2 ** 96))

      addToast({
        title: "Creating Pool",
        description: "Please confirm the transaction in your wallet...",
        variant: "default",
      })

      const hash = await writeContractAsync({
        address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: "createAndInitializePoolIfNecessary",
        args: [createToken0 as `0x${string}`, createToken1 as `0x${string}`, createFeeTier, sqrtPriceX96],
      })

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171"],
      })

      addToast({
        title: "Pool Created!",
        description: "Uniswap V3 pool has been successfully created",
        variant: "success",
      })

      setCreateToken0("")
      setCreateToken1("")
      setInitialPrice("")
    } catch (error: any) {
      console.error("[v0] Failed to create pool:", error)
      addToast({
        title: "Pool Creation Failed",
        description: error.message?.includes("User rejected") ? "Transaction rejected" : "Failed to create pool",
        variant: "error",
      })
    } finally {
      setIsCreatingPool(false)
    }
  }

  const handleAddLiquidity = async () => {
    if (!address || !chainId || !token0Address || !token1Address || !amount0 || !amount1) return

    setIsAddingLiquidity(true)
    try {
      const amount0Parsed = parseUnits(amount0, 18)
      const amount1Parsed = parseUnits(amount1, 18)

      // Approve tokens first
      addToast({
        title: "Approval Required",
        description: "Approving tokens for liquidity pool...",
        variant: "default",
      })

      await writeContractAsync({
        address: token0Address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
          amount0Parsed,
        ],
      })

      await writeContractAsync({
        address: token1Address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
          amount1Parsed,
        ],
      })

      addToast({
        title: "Adding Liquidity",
        description: "Please confirm the transaction in your wallet...",
        variant: "default",
      })

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

      const hash = await writeContractAsync({
        address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: "mint",
        args: [
          {
            token0: token0Address as `0x${string}`,
            token1: token1Address as `0x${string}`,
            fee: feeTier,
            tickLower: -887220,
            tickUpper: 887220,
            amount0Desired: amount0Parsed,
            amount1Desired: amount1Parsed,
            amount0Min: 0n,
            amount1Min: 0n,
            recipient: address,
            deadline,
          },
        ],
      })

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171"],
      })

      addToast({
        title: "Liquidity Added!",
        description: "Successfully added liquidity to the pool",
        variant: "success",
      })

      setAmount0("")
      setAmount1("")
      loadPositions()
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

  const handleCollectFees = async (tokenId: bigint) => {
    if (!address || !chainId) return

    try {
      addToast({
        title: "Collecting Fees",
        description: "Please confirm the transaction in your wallet...",
        variant: "default",
      })

      await writeContractAsync({
        address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
        abi: UNISWAP_V3_POSITION_MANAGER_ABI,
        functionName: "collect",
        args: [
          {
            tokenId,
            recipient: address,
            amount0Max: BigInt("340282366920938463463374607431768211455"),
            amount1Max: BigInt("340282366920938463463374607431768211455"),
          },
        ],
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#34D399", "#6EE7B7"],
      })

      addToast({
        title: "Fees Collected!",
        description: "Successfully collected trading fees",
        variant: "success",
      })

      loadPositions()
    } catch (error: any) {
      console.error("[v0] Failed to collect fees:", error)
      addToast({
        title: "Failed to Collect Fees",
        description: error.message?.includes("User rejected") ? "Transaction rejected" : "Failed to collect fees",
        variant: "error",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="relative">
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 rounded-3xl blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />

            <div className="relative bg-gradient-to-br from-card/80 via-card/50 to-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-12 shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-8">
                {/* Animated wallet icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                  <div className="relative rounded-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 p-8 backdrop-blur-sm border border-primary/30 shadow-2xl shadow-primary/20 animate-float">
                    <Wallet className="h-16 w-16 text-primary" />
                  </div>
                </div>

                {/* Heading and description */}
                <div className="space-y-4 max-w-2xl">
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent text-balance">
                    Connect Your Wallet to Get Started
                  </h1>
                  <p className="text-lg text-muted-foreground text-balance leading-relaxed">
                    Access professional-grade liquidity management tools and start earning trading fees from Uniswap V3
                    pools on Base network.
                  </p>
                </div>

                {/* Connect button */}
                <Button
                  onClick={connect}
                  size="lg"
                  className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
                >
                  <Wallet className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                  Connect Wallet
                  <ArrowUpRight className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 pt-8 border-t border-border/50">
                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 group">
                    <div className="rounded-full bg-blue-500/20 p-3 group-hover:bg-blue-500/30 transition-colors">
                      <DollarSign className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-sm mb-1">Earn Trading Fees</h3>
                      <p className="text-xs text-muted-foreground text-balance">
                        Collect fees from every swap in your pools
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 group">
                    <div className="rounded-full bg-purple-500/20 p-3 group-hover:bg-purple-500/30 transition-colors">
                      <BarChart3 className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-sm mb-1">Track Performance</h3>
                      <p className="text-xs text-muted-foreground text-balance">
                        Monitor your positions and earnings in real-time
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105 group">
                    <div className="rounded-full bg-green-500/20 p-3 group-hover:bg-green-500/30 transition-colors">
                      <Droplet className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-sm mb-1">Manage Liquidity</h3>
                      <p className="text-xs text-muted-foreground text-balance">
                        Add, remove, and optimize your LP positions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Powered by Uniswap V3</span>
                  </div>
                  <span className="text-border">•</span>
                  <span>Base Network</span>
                  <span className="text-border">•</span>
                  <span>Non-custodial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-3 animate-pulse">
            <Droplet className="h-8 w-8 text-primary" />
          </div>
          Liquidity Pool Manager
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage Uniswap V3 liquidity positions and earn trading fees on Base network
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-border/50 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Total Value Locked</span>
            </div>
            <p className="text-3xl font-bold">${totalTVL.toFixed(2)}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-border/50 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Active Positions</span>
            </div>
            <p className="text-3xl font-bold">{positions.length}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-border/50 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Droplet className="h-4 w-4" />
              <span>Unclaimed Fees</span>
            </div>
            <p className="text-3xl font-bold">${totalUnclaimedFees.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("positions")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "positions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Your Positions
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "add"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "create"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Pool
        </button>
      </div>

      {activeTab === "positions" && (
        <div className="space-y-4">
          {isLoadingPositions ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-muted-foreground">Loading your liquidity positions...</p>
              </div>
            </Card>
          ) : positions.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-6">
                  <Droplet className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Liquidity Positions</h3>
                <p className="text-muted-foreground">
                  You don't have any active liquidity positions yet. Add liquidity to start earning trading fees.
                </p>
              </div>
              <Button onClick={() => setActiveTab("add")} className="gap-2">
                <Droplet className="h-4 w-4" />
                Add Liquidity
              </Button>
            </Card>
          ) : (
            positions.map((position) => (
              <Card key={position.tokenId.toString()} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center -space-x-3">
                      {position.token0Metadata?.image && (
                        <img
                          src={position.token0Metadata.image || "/placeholder.svg"}
                          alt={position.token0Metadata.symbol}
                          className="h-12 w-12 rounded-full border-2 border-background"
                        />
                      )}
                      {position.token1Metadata?.image && (
                        <img
                          src={position.token1Metadata.image || "/placeholder.svg"}
                          alt={position.token1Metadata.symbol}
                          className="h-12 w-12 rounded-full border-2 border-background"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {position.token0Metadata?.symbol} / {position.token1Metadata?.symbol}
                      </h3>
                      <p className="text-sm text-muted-foreground">Fee Tier: {position.fee / 10000}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${position.totalValueUSD?.toFixed(2) || "0.00"}</p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Position ID</p>
                    <p className="font-mono text-sm">#{position.tokenId.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Unclaimed Fees</p>
                    <p className="text-lg font-semibold text-green-500">${position.feesUSD?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>

                {position.feesUSD && position.feesUSD > 0 && (
                  <Button
                    onClick={() => handleCollectFees(position.tokenId)}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <DollarSign className="h-4 w-4" />
                    Collect Fees
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "add" && (
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Add Liquidity to Pool</h2>
            <p className="text-muted-foreground">Provide liquidity to a Uniswap V3 pool and earn trading fees</p>
          </div>

          <div className="space-y-4">
            {/* Token Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Token 0 Address</label>
                <input
                  type="text"
                  value={token0Address}
                  onChange={(e) => setToken0Address(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Token 1 Address</label>
                <input
                  type="text"
                  value={token1Address}
                  onChange={(e) => setToken1Address(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Quick select from tokenized tracks */}
            {tokenizedTracks.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Select Tokenized Tracks</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tokenizedTracks.slice(0, 6).map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setToken0Address(track.coin_address)}
                      className="p-3 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors text-sm"
                    >
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Tier */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fee Tier</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFeeTier(500)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    feeTier === 500 ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                  }`}
                >
                  <p className="font-bold">0.05%</p>
                  <p className="text-xs text-muted-foreground">Best for stable pairs</p>
                </button>
                <button
                  onClick={() => setFeeTier(3000)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    feeTier === 3000 ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                  }`}
                >
                  <p className="font-bold">0.3%</p>
                  <p className="text-xs text-muted-foreground">Best for most pairs</p>
                </button>
                <button
                  onClick={() => setFeeTier(10000)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    feeTier === 10000 ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                  }`}
                >
                  <p className="font-bold">1%</p>
                  <p className="text-xs text-muted-foreground">Best for exotic pairs</p>
                </button>
              </div>
            </div>

            {/* Pool Status */}
            {isCheckingPool ? (
              <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm">Checking pool status...</p>
              </div>
            ) : poolExists === false ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ This pool doesn't exist yet. Create it first in the "Create Pool" tab.
                </p>
              </div>
            ) : poolExists === true ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">✓ Pool exists! You can add liquidity.</p>
              </div>
            ) : null}

            {/* Amount inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Token 0</label>
                <input
                  type="number"
                  value={amount0}
                  onChange={(e) => setAmount0(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Token 1</label>
                <input
                  type="number"
                  value={amount1}
                  onChange={(e) => setAmount1(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <Button
              onClick={handleAddLiquidity}
              disabled={
                isAddingLiquidity || !token0Address || !token1Address || !amount0 || !amount1 || poolExists === false
              }
              className="w-full gap-2"
              size="lg"
            >
              {isAddingLiquidity ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Adding Liquidity...
                </>
              ) : (
                <>
                  <Droplet className="h-5 w-5" />
                  Add Liquidity
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "create" && (
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Create New Pool</h2>
            <p className="text-muted-foreground">Create a new Uniswap V3 liquidity pool with your chosen token pair</p>
          </div>

          <div className="space-y-4">
            {/* Token Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Token 0 Address</label>
                <input
                  type="text"
                  value={createToken0}
                  onChange={(e) => setCreateToken0(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Token 1 Address</label>
                <input
                  type="text"
                  value={createToken1}
                  onChange={(e) => setCreateToken1(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Quick select from tokenized tracks */}
            {tokenizedTracks.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Select Tokenized Tracks</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tokenizedTracks.slice(0, 6).map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setCreateToken0(track.coin_address)}
                      className="p-3 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors text-sm"
                    >
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Tier */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fee Tier</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCreateFeeTier(500)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    createFeeTier === 500 ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                  }`}
                >
                  <p className="font-bold">0.05%</p>
                  <p className="text-xs text-muted-foreground">Stable pairs</p>
                </button>
                <button
                  onClick={() => setCreateFeeTier(3000)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    createFeeTier === 3000 ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                  }`}
                >
                  <p className="font-bold">0.3%</p>
                  <p className="text-xs text-muted-foreground">Most pairs</p>
                </button>
                <button
                  onClick={() => setCreateFeeTier(10000)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    createFeeTier === 10000 ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                  }`}
                >
                  <p className="font-bold">1%</p>
                  <p className="text-xs text-muted-foreground">Exotic pairs</p>
                </button>
              </div>
            </div>

            {/* Initial Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Price (Token1 per Token0)</label>
              <input
                type="number"
                value={initialPrice}
                onChange={(e) => setInitialPrice(e.target.value)}
                placeholder="1.0"
                step="0.000001"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                This sets the starting price ratio for the pool. Choose carefully as it affects initial liquidity
                distribution.
              </p>
            </div>

            <Button
              onClick={handleCreatePool}
              disabled={isCreatingPool || !createToken0 || !createToken1 || !initialPrice}
              className="w-full gap-2"
              size="lg"
            >
              {isCreatingPool ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating Pool...
                </>
              ) : (
                <>
                  <Droplet className="h-5 w-5" />
                  Create Pool
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
