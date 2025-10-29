"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Droplet,
  Plus,
  Minus,
  Wallet,
  Loader2,
  Info,
  AlertCircle,
  Coins,
  DollarSign,
  BarChart3,
  Settings,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Activity,
} from "lucide-react"
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
import Image from "next/image"

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

      for (let i = 0; i < count; i++) {
        const tokenId = await publicClient.readContract({
          address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(i)],
        })

        const position = await publicClient.readContract({
          address: UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER] as `0x${string}`,
          abi: UNISWAP_V3_POSITION_MANAGER_ABI,
          functionName: "positions",
          args: [tokenId as bigint],
        })

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
        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-border/50 backdrop-blur-xl hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {positions.length}
              </span>
              <span className="text-sm text-muted-foreground">LP NFTs</span>
            </div>
            {positions.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>Earning fees</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-500">
                ${totalTVL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Across {positions.length} {positions.length === 1 ? "position" : "positions"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 backdrop-blur-xl hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Unclaimed Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-500">
                ${totalUnclaimedFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {totalUnclaimedFees > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
                <ArrowUpRight className="h-3 w-3 animate-bounce" />
                <span>Ready to collect</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="positions" className="data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4 mr-2" />
            My Positions
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-background">
            <Plus className="h-4 w-4 mr-2" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-background">
            <Settings className="h-4 w-4 mr-2" />
            Create Pool
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4 mt-6">
          {isLoadingPositions ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gradient-to-br from-card to-card/50 border-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center -space-x-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-16 rounded-lg" />
                      <Skeleton className="h-16 rounded-lg" />
                    </div>
                    <Skeleton className="h-24 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : positions.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-8 mb-6 animate-pulse">
                  <Droplet className="h-20 w-20 text-primary/50" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Liquidity Positions</h3>
                <p className="text-muted-foreground text-center max-w-md mb-8">
                  You don't have any active liquidity positions yet. Add liquidity to start earning trading fees from
                  every swap.
                </p>
                <Button onClick={() => setActiveTab("add")} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add Your First Position
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {positions.map((position) => (
                <Card
                  key={position.tokenId.toString()}
                  className="bg-gradient-to-br from-card via-card/90 to-card/50 border-border/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] group"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-3">
                          {position.token0Metadata?.image && (
                            <div className="relative h-12 w-12 rounded-full border-2 border-background overflow-hidden bg-muted ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                              <Image
                                src={position.token0Metadata.image || "/placeholder.svg"}
                                alt={position.token0Metadata.symbol}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          {position.token1Metadata?.image && (
                            <div className="relative h-12 w-12 rounded-full border-2 border-background overflow-hidden bg-muted ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                              <Image
                                src={position.token1Metadata.image || "/placeholder.svg"}
                                alt={position.token1Metadata.symbol}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold">
                            {position.token0Metadata?.symbol || "???"} / {position.token1Metadata?.symbol || "???"}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Position #{position.tokenId.toString().slice(0, 8)}...
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold">
                        {(position.fee / 10000).toFixed(2)}%
                      </div>
                    </div>

                    {position.totalValueUSD !== undefined && position.totalValueUSD > 0 && (
                      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Position Value
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                          $
                          {position.totalValueUSD.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors">
                        <p className="text-muted-foreground mb-1 text-xs flex items-center gap-1">
                          <Droplet className="h-3 w-3" />
                          Liquidity
                        </p>
                        <p className="font-semibold text-sm">{position.liquidity.toString().slice(0, 10)}...</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors">
                        <p className="text-muted-foreground mb-1 text-xs flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Price Range
                        </p>
                        <p className="font-semibold text-xs">Full Range</p>
                      </div>
                    </div>

                    {(position.tokensOwed0 > 0n || position.tokensOwed1 > 0n) && (
                      <div className="rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/20 p-4 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                              <Coins className="h-4 w-4" />
                              Unclaimed Fees
                            </p>
                            {position.feesUSD !== undefined && position.feesUSD > 0 && (
                              <p className="text-2xl font-bold text-green-500">
                                $
                                {position.feesUSD.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            )}
                          </div>
                          <div className="rounded-full bg-green-500/20 p-3">
                            <Coins className="h-6 w-6 text-green-500" />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCollectFees(position.tokenId)}
                          className="w-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Collect Fees
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 bg-transparent hover:bg-primary/10" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent hover:bg-destructive/10" size="sm">
                        <Minus className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-transparent hover:bg-muted"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://basescan.org/token/${UNISWAP_V3_POSITION_MANAGER[chainId as keyof typeof UNISWAP_V3_POSITION_MANAGER]}?a=${position.tokenId}`,
                            "_blank",
                          )
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add Liquidity Tab */}
        <TabsContent value="add" className="space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Add Liquidity to Pool</CardTitle>
              <CardDescription>Provide liquidity to earn trading fees from swaps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Select Tokenized Tracks */}
              {tokenizedTracks.length > 0 && (
                <div className="space-y-3">
                  <Label>Quick Select: Tokenized Tracks</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {tokenizedTracks.slice(0, 4).map((track) => (
                      <Button
                        key={track.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setToken1Address(track.coin_address)
                          setToken0Address(WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS])
                        }}
                        className="justify-start gap-2 bg-transparent"
                      >
                        {track.cover_url && (
                          <div className="relative h-6 w-6 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={track.cover_url || "/placeholder.svg"}
                              alt={track.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="truncate">{track.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="token0">Token 0 Address</Label>
                  <Input
                    id="token0"
                    placeholder="0x..."
                    value={token0Address}
                    onChange={(e) => setToken0Address(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token1">Token 1 Address</Label>
                  <Input
                    id="token1"
                    placeholder="0x..."
                    value={token1Address}
                    onChange={(e) => setToken1Address(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fee Tier</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 3000, 10000].map((fee) => (
                    <Button
                      key={fee}
                      variant={feeTier === fee ? "default" : "outline"}
                      onClick={() => setFeeTier(fee as any)}
                      className={feeTier !== fee ? "bg-transparent" : ""}
                    >
                      {(fee / 10000).toFixed(2)}%
                    </Button>
                  ))}
                </div>
              </div>

              {isCheckingPool && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking pool availability...</span>
                </div>
              )}

              {poolExists === false && (
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Pool doesn't exist</p>
                    <p className="text-xs mt-1">You need to create this pool first in the "Create Pool" tab</p>
                  </div>
                </div>
              )}

              {poolExists === true && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Pool exists - ready to add liquidity</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount0">Token 0 Amount</Label>
                  <Input
                    id="amount0"
                    type="number"
                    placeholder="0.0"
                    value={amount0}
                    onChange={(e) => setAmount0(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount1">Token 1 Amount</Label>
                  <Input
                    id="amount1"
                    type="number"
                    placeholder="0.0"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>
                  This will add liquidity across the full price range. You'll earn fees from all trades in this pool.
                  Concentrated liquidity ranges coming soon.
                </p>
              </div>

              <Button
                onClick={handleAddLiquidity}
                disabled={
                  !token0Address || !token1Address || !amount0 || !amount1 || poolExists === false || isAddingLiquidity
                }
                className="w-full"
                size="lg"
              >
                {isAddingLiquidity ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Liquidity...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Liquidity
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Pool Tab */}
        <TabsContent value="create" className="space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Create New Uniswap V3 Pool</CardTitle>
              <CardDescription>Initialize a new liquidity pool for a token pair</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-token0">Token 0 Address</Label>
                  <Input
                    id="create-token0"
                    placeholder="0x..."
                    value={createToken0}
                    onChange={(e) => setCreateToken0(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-token1">Token 1 Address</Label>
                  <Input
                    id="create-token1"
                    placeholder="0x..."
                    value={createToken1}
                    onChange={(e) => setCreateToken1(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fee Tier</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 3000, 10000].map((fee) => (
                    <Button
                      key={fee}
                      variant={createFeeTier === fee ? "default" : "outline"}
                      onClick={() => setCreateFeeTier(fee as any)}
                      className={createFeeTier !== fee ? "bg-transparent" : ""}
                    >
                      {(fee / 10000).toFixed(2)}%
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  0.05% for stablecoins, 0.3% for most pairs, 1% for exotic pairs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial-price">Initial Price (Token1/Token0)</Label>
                <Input
                  id="initial-price"
                  type="number"
                  placeholder="1.0"
                  value={initialPrice}
                  onChange={(e) => setInitialPrice(e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Set the starting price for this pool. This determines the initial exchange rate.
                </p>
              </div>

              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Important</p>
                  <p className="mt-1">
                    Creating a pool is permanent and cannot be undone. Make sure the token addresses and initial price
                    are correct.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCreatePool}
                disabled={!createToken0 || !createToken1 || !initialPrice || isCreatingPool}
                className="w-full"
                size="lg"
              >
                {isCreatingPool ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Pool...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Create Pool
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
