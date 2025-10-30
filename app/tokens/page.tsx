"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import { useWallet } from "@/lib/web3/wallet-context"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenDetailDrawer } from "@/components/token-detail-drawer"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddLiquidityDrawer } from "@/components/add-liquidity-drawer"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AnimatedCounter } from "@/components/animated-counter"
import {
  Play,
  Pause,
  Coins,
  TrendingUp,
  ExternalLink,
  Search,
  Music,
  Zap,
  Droplet,
  Heart,
  X,
  BarChart3,
  Activity,
  Filter,
  SlidersHorizontal,
  ArrowRight,
  Loader2,
  AlertCircle,
  DollarSign,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { useWriteContract, usePublicClient } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import {
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
} from "@/lib/web3/contracts"
import confetti from "canvas-confetti"

interface TokenizedTrack {
  id: string
  title: string
  artist_id: string
  artist_name: string
  cover_url: string
  audio_url: string
  coin_address: string
  nft_contract_address: string | null
  token_id: string | null
  price_per_chunk: number
  duration: number
  created_at: string
}

interface TokenMetrics {
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  liquidity: number
  holders: number
  txns24h: number
}

const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006",
  84532: "0x4200000000000000000000000000000000000006",
} as const

export default function TokensPage() {
  const { address, isConnected, chainId, connect } = useWallet()
  const { currentTrack, isPlaying, playTrack, pause } = useAudioPlayer()
  const { addToast } = useToast()
  const [tracks, setTracks] = useState<TokenizedTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">("trending")
  const [selectedTrack, setSelectedTrack] = useState<TokenizedTrack | null>(null)
  const [swapAmount, setSwapAmount] = useState("")
  const [swapOutput, setSwapOutput] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [poolInfo, setPoolInfo] = useState<{ address: string; fee: number } | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [detailToken, setDetailToken] = useState<TokenizedTrack | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set())
  const [liquidityDrawerOpen, setLiquidityDrawerOpen] = useState(false)
  const [selectedLiquidityToken, setSelectedLiquidityToken] = useState<TokenizedTrack | null>(null)

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [priceFilter, setPriceFilter] = useState<"all" | "low" | "mid" | "high">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const { data: aggregateMetrics, error: metricsError } = useSWR(
    "/api/tokens/aggregate-metrics",
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch aggregate metrics")
      return response.json()
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      fallbackData: { totalVolume24h: 0, totalMarketCap: 0 }, // Added fallback data
      onError: (err) => {
        console.error("[v0] Failed to fetch aggregate metrics:", err)
      },
    },
  )

  const [tokenMetrics, setTokenMetrics] = useState<Record<string, TokenMetrics>>({})
  const [loadingMetrics, setLoadingMetrics] = useState<Set<string>>(new Set())

  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  useEffect(() => {
    const savedFavorites = localStorage.getItem("tokenFavorites")
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("tokenFavorites", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  useEffect(() => {
    loadTokenizedTracks()
  }, [sortBy])

  // useEffect(() => {
  //   loadAggregateMetrics()
  // }, [])

  // const loadAggregateMetrics = async () => {
  //   setIsLoadingMetrics(true)
  //   try {
  //     const response = await fetch("/api/tokens/aggregate-metrics")
  //     if (!response.ok) throw new Error("Failed to fetch aggregate metrics")
  //     const data = await response.json()
  //     setAggregateMetrics(data)
  //   } catch (error) {
  //     console.error("[v0] Failed to load aggregate metrics:", error)
  //   } finally {
  //     setIsLoadingMetrics(false)
  //   }
  // }

  const loadTokenizedTracks = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from("tracks")
        .select(`
          *,
          profiles!tracks_artist_id_fkey (
            artist_name
          )
        `)
        .not("coin_address", "is", null)
        .eq("is_active", true)

      if (sortBy === "recent") {
        query = query.order("created_at", { ascending: false })
      }

      const { data, error } = await query.limit(50)

      if (error) throw error

      console.log("[v0] Fetched tracks from database:", data?.length, "tracks")
      if (data && data.length > 0) {
        console.log("[v0] Sample track data:", {
          id: data[0].id,
          title: data[0].title,
          has_audio_url: !!data[0].audio_url,
          audio_url_type: typeof data[0].audio_url,
          audio_url_value: data[0].audio_url,
        })
      }

      const formattedTracks = data.map((track: any) => ({
        ...track,
        artist_name: track.profiles?.artist_name || "Unknown Artist",
      }))

      console.log("[v0] Formatted tracks sample:", {
        id: formattedTracks[0]?.id,
        title: formattedTracks[0]?.title,
        has_audio_url: !!formattedTracks[0]?.audio_url,
        audio_url: formattedTracks[0]?.audio_url,
      })

      setTracks(formattedTracks)
    } catch (error) {
      console.error("[v0] Failed to load tokenized tracks:", error)
      addToast({
        title: "Error",
        description: "Failed to load tokenized tracks",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = (track: TokenizedTrack) => {
    console.log("[v0] Play button clicked for track:", {
      id: track.id,
      title: track.title,
      has_audio_url: !!track.audio_url,
      audio_url_type: typeof track.audio_url,
      audio_url_value: track.audio_url,
      audio_url_length: track.audio_url?.length,
    })

    if (!track.audio_url || track.audio_url.trim() === "") {
      console.log("[v0] Track has no audio URL, showing error toast")
      addToast({
        title: "No Audio Available",
        description: "This track hasn't been uploaded with audio yet. Only the token is available for trading.",
        variant: "error",
      })
      return
    }

    if (currentTrack?.id === track.id && isPlaying) {
      pause()
    } else {
      playTrack(track as any)
    }
  }

  const toggleFavorite = (trackId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(trackId)) {
        newFavorites.delete(trackId)
      } else {
        newFavorites.add(trackId)
      }
      return newFavorites
    })
  }

  useEffect(() => {
    if (selectedTrack && chainId) {
      checkPoolAvailability(selectedTrack.coin_address)
    }
  }, [selectedTrack, chainId])

  const checkPoolAvailability = async (tokenAddress: string) => {
    if (!chainId || !publicClient) return

    setIsCheckingPool(true)
    setPoolInfo(null)
    setQuoteError(null)

    try {
      const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]
      const feeTiers = [500, 3000, 10000]

      for (const fee of feeTiers) {
        const poolAddress = await publicClient.readContract({
          address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
          abi: UNISWAP_V3_FACTORY_ABI,
          functionName: "getPool",
          args: [wethAddress as `0x${string}`, tokenAddress as `0x${string}`, fee],
        })

        if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
          setPoolInfo({ address: poolAddress as string, fee })
          return
        }
      }

      setQuoteError("No Uniswap V3 pool found for this token. Liquidity needs to be added first.")
    } catch (error) {
      console.error("[v0] Failed to check pool:", error)
      setQuoteError("Failed to check pool availability")
    } finally {
      setIsCheckingPool(false)
    }
  }

  useEffect(() => {
    if (selectedTrack && swapAmount && poolInfo && chainId) {
      fetchQuote()
    } else {
      setSwapOutput("")
    }
  }, [swapAmount, poolInfo, selectedTrack, chainId])

  const fetchQuote = async () => {
    if (!selectedTrack || !swapAmount || !poolInfo || !chainId || !publicClient) return

    const amount = Number.parseFloat(swapAmount)
    if (isNaN(amount) || amount <= 0) {
      setSwapOutput("")
      return
    }

    try {
      const amountIn = parseUnits(swapAmount, 18)
      const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]

      const quoteData = await publicClient.readContract({
        address: UNISWAP_V3_QUOTER[chainId as keyof typeof UNISWAP_V3_QUOTER] as `0x${string}`,
        abi: UNISWAP_V3_QUOTER_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: wethAddress as `0x${string}`,
            tokenOut: selectedTrack.coin_address as `0x${string}`,
            amountIn,
            fee: poolInfo.fee,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })

      if (quoteData && Array.isArray(quoteData) && quoteData[0]) {
        const amountOut = quoteData[0] as bigint
        setSwapOutput(formatUnits(amountOut, 18))
        setQuoteError(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch quote:", error)
      setQuoteError("Failed to fetch price quote")
      setSwapOutput("")
    }
  }

  const handleSwap = async (track: TokenizedTrack) => {
    if (!address || !chainId || !swapAmount || !poolInfo) return

    setIsSwapping(true)
    try {
      const amountIn = parseUnits(swapAmount, 18)
      const tokenOut = track.coin_address as `0x${string}`
      const tokenIn = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] as `0x${string}`

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
            tokenIn,
            tokenOut,
            fee: poolInfo.fee,
            recipient: address,
            amountIn,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n,
          },
        ],
        value: amountIn,
      })

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5", "#ffffff"],
      })

      addToast({
        title: "Swap Successful!",
        description: `Successfully swapped ${swapAmount} ETH for ${track.title} tokens`,
        variant: "success",
      })

      setSwapAmount("")
      setSwapOutput("")
      setSelectedTrack(null)
      setPoolInfo(null)
    } catch (error: any) {
      console.error("[v0] Swap failed:", error)
      addToast({
        title: "Swap Failed",
        description: error.message?.includes("User rejected") ? "Transaction rejected" : "Failed to execute swap",
        variant: "error",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  const handleSwapClick = (track: TokenizedTrack) => {
    console.log("[v0] Swap button clicked for track:", track.title)
    if (!isConnected) {
      console.log("[v0] Wallet not connected, prompting connection")
      addToast({
        title: "Wallet Required",
        description: "Please connect your wallet to swap tokens",
        variant: "default",
      })
      connect()
      return
    }
    console.log("[v0] Opening swap drawer")
    setSelectedTrack(track)
  }

  const handleSwapSheetChange = (open: boolean) => {
    console.log("[v0] Swap sheet state changing to:", open)
    if (!open) {
      console.log("[v0] Clearing swap state")
      setSelectedTrack(null)
      setPoolInfo(null)
      setSwapAmount("")
      setSwapOutput("")
      setQuoteError(null)
    }
  }

  const handleLiquidityClick = (track: TokenizedTrack) => {
    console.log("[v0] Add Liquidity button clicked for track:", track.title)
    if (!isConnected) {
      console.log("[v0] Wallet not connected, prompting connection")
      addToast({
        title: "Wallet Required",
        description: "Please connect your wallet to add liquidity",
        variant: "default",
      })
      connect()
      return
    }
    console.log("[v0] Opening liquidity drawer")
    setSelectedLiquidityToken(track)
    setLiquidityDrawerOpen(true)
  }

  const handleLiquidityDrawerChange = (open: boolean) => {
    console.log("[v0] Liquidity drawer state changing to:", open)
    setLiquidityDrawerOpen(open)
    if (!open) {
      console.log("[v0] Clearing selected liquidity token")
      setSelectedLiquidityToken(null)
    }
  }

  const filteredTracks = useMemo(() => {
    let filtered = tracks.filter(
      (track) =>
        (track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!showFilters || favorites.has(track.id)),
    )

    if (priceFilter !== "all") {
      filtered = filtered.filter((track) => {
        const price = track.price_per_chunk
        if (priceFilter === "low") return price < 0.001
        if (priceFilter === "mid") return price >= 0.001 && price < 0.01
        if (priceFilter === "high") return price >= 0.01
        return true
      })
    }

    return filtered
  }, [tracks, searchQuery, showFilters, favorites, priceFilter])

  const stats = useMemo(() => {
    return {
      totalTokens: tracks.length,
      totalFavorites: favorites.size,
      recentlyAdded: tracks.filter((t) => {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        return new Date(t.created_at).getTime() > dayAgo
      }).length,
    }
  }, [tracks, favorites])

  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  useEffect(() => {
    filteredTracks.forEach((track) => {
      if (track.coin_address && !tokenMetrics[track.coin_address]) {
        fetchTokenMetrics(track.coin_address)
      }
    })
  }, [filteredTracks])

  const fetchTokenMetrics = async (tokenAddress: string) => {
    if (loadingMetrics.has(tokenAddress) || tokenMetrics[tokenAddress]) {
      return // Already loading or loaded
    }

    setLoadingMetrics((prev) => new Set(prev).add(tokenAddress))

    try {
      const response = await fetch(`/api/token/metrics/${tokenAddress}`)
      if (!response.ok) throw new Error("Failed to fetch token metrics")

      const data = await response.json()
      setTokenMetrics((prev) => ({
        ...prev,
        [tokenAddress]: data,
      }))
    } catch (error) {
      console.error("[v0] Failed to fetch token metrics:", error)
    } finally {
      setLoadingMetrics((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tokenAddress)
        return newSet
      })
    }
  }

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`
    }
    return value.toFixed(2)
  }

  const handleViewDetails = (track: TokenizedTrack) => {
    setDetailToken(track)
    setDetailDrawerOpen(true)
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <main className="container relative z-10 py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-primary/50 p-2 sm:p-3 rounded-xl">
                <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent animate-gradient">
                Tokenized Music
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Stream, trade, and provide liquidity for tokenized songs on Base
              </p>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="glass-premium rounded-lg sm:rounded-xl p-3 sm:p-4 hover-lift">
            <div className="flex flex-col gap-2">
              <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg w-fit">
                <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  <AnimatedCounter value={stats.totalTokens} />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Tokens</p>
              </div>
            </div>
          </div>
          <div className="glass-premium rounded-lg sm:rounded-xl p-3 sm:p-4 hover-lift">
            <div className="flex flex-col gap-2">
              <div className="bg-green-500/10 p-1.5 sm:p-2 rounded-lg w-fit">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  <AnimatedCounter
                    value={aggregateMetrics?.totalVolume24h || 0}
                    formatFn={formatCurrency}
                    duration={1800}
                  />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">24h Volume</p>
              </div>
            </div>
          </div>
          <div className="glass-premium rounded-lg sm:rounded-xl p-3 sm:p-4 hover-lift">
            <div className="flex flex-col gap-2">
              <div className="bg-blue-500/10 p-1.5 sm:p-2 rounded-lg w-fit">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  <AnimatedCounter
                    value={aggregateMetrics?.totalMarketCap || 0}
                    formatFn={formatCurrency}
                    duration={1800}
                  />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Market Cap</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search tracks or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 glass-premium border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-12 w-12 shrink-0 glass-premium hover-lift"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {showAdvancedFilters && (
            <Card className="glass-premium border-border/50 animate-in slide-in-from-top-2 duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Price Range
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant={priceFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriceFilter("all")}
                      className="h-10 hover-lift"
                    >
                      All
                    </Button>
                    <Button
                      variant={priceFilter === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriceFilter("low")}
                      className="h-10 hover-lift"
                    >
                      {"< 0.001"}
                    </Button>
                    <Button
                      variant={priceFilter === "mid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriceFilter("mid")}
                      className="h-10 hover-lift"
                    >
                      0.001-0.01
                    </Button>
                    <Button
                      variant={priceFilter === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriceFilter("high")}
                      className="h-10 hover-lift"
                    >
                      {"> 0.01"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="w-full overflow-x-auto scrollbar-hide scroll-smooth-x">
            <div className="flex gap-2 pb-2">
              <Button
                variant={sortBy === "trending" ? "default" : "outline"}
                onClick={() => setSortBy("trending")}
                className="gap-2 h-11 whitespace-nowrap hover-lift flex-shrink-0"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Button>
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                onClick={() => setSortBy("recent")}
                className="gap-2 h-11 whitespace-nowrap hover-lift flex-shrink-0"
              >
                <Activity className="h-4 w-4" />
                Recent
              </Button>
              <Button
                variant={sortBy === "popular" ? "default" : "outline"}
                onClick={() => setSortBy("popular")}
                className="gap-2 h-11 whitespace-nowrap hover-lift flex-shrink-0"
              >
                <BarChart3 className="h-4 w-4" />
                Popular
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 h-11 whitespace-nowrap hover-lift flex-shrink-0"
              >
                <Heart className="h-4 w-4" />
                Favorites
                {favorites.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                    {favorites.size}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden glass-premium border-border/50">
                <Skeleton className="aspect-square w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-11 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
          <Card className="border-dashed border-2 glass-premium">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 sm:p-8 rounded-full">
                  <Music className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">No Tokens Found</h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md mb-4 sm:mb-6 px-4">
                {searchQuery
                  ? "No tracks match your search. Try different keywords."
                  : showFilters
                    ? "You haven't favorited any tokens yet. Click the heart icon on tokens to add them to your favorites."
                    : "No tokenized tracks available yet. Check back soon!"}
              </p>
              {(searchQuery || showFilters) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setShowFilters(false)
                  }}
                  className="gap-2 hover-lift"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTracks.map((track, index) => {
              const metrics = tokenMetrics[track.coin_address]
              const isLoadingMetrics = loadingMetrics.has(track.coin_address)

              return (
                <Card
                  key={track.id}
                  className="group relative overflow-hidden glass-premium border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {!imagesLoaded.has(track.id) && <Skeleton className="absolute inset-0" />}
                    <img
                      src={track.cover_url || "/placeholder.svg?height=400&width=400"}
                      alt={track.title}
                      loading="lazy"
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                        imagesLoaded.has(track.id) ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setImagesLoaded((prev) => new Set(prev).add(track.id))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                    {track.audio_url && track.audio_url.trim() !== "" ? (
                      <Button
                        size="icon"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 sm:h-20 sm:w-20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 bg-primary/90 hover:bg-primary backdrop-blur-sm shadow-2xl shadow-primary/50 touch-manipulation"
                        onClick={() => handlePlay(track)}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="h-8 w-8 sm:h-10 sm:w-10" />
                        ) : (
                          <Play className="h-8 w-8 sm:h-10 sm:w-10 ml-1" />
                        )}
                      </Button>
                    ) : (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/80 backdrop-blur-sm rounded-full p-4 border border-white/20">
                          <AlertCircle className="h-8 w-8 text-yellow-500" />
                        </div>
                        <p className="text-xs text-white text-center mt-2 font-medium">No Audio</p>
                      </div>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-3 right-3 h-11 w-11 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300 touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(track.id)
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 transition-all duration-300 ${
                          favorites.has(track.id) ? "fill-red-500 text-red-500 scale-110" : "text-white"
                        }`}
                      />
                    </Button>

                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5" />
                        Tokenized
                      </span>
                    </div>

                    {(!track.audio_url || track.audio_url.trim() === "") && (
                      <div className="absolute bottom-3 left-3 bg-yellow-500/90 backdrop-blur-md border border-yellow-400/30 px-3 py-1.5 rounded-full shadow-lg">
                        <span className="text-xs font-bold text-black flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Token Only
                        </span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-1 text-lg">{track.title}</CardTitle>
                    <CardDescription className="line-clamp-1 flex items-center gap-2">
                      {track.artist_name}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 bg-muted/30 rounded-lg p-3 border border-border/30">
                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <div className="bg-green-500/10 p-1.5 rounded">
                          <DollarSign className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Price</p>
                          {isLoadingMetrics ? (
                            <Skeleton className="h-4 w-12" />
                          ) : (
                            <p className="text-sm font-bold truncate">
                              {metrics?.price ? `$${metrics.price.toFixed(6)}` : "N/A"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Market Cap */}
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-500/10 p-1.5 rounded">
                          <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">MCap</p>
                          {isLoadingMetrics ? (
                            <Skeleton className="h-4 w-12" />
                          ) : (
                            <p className="text-sm font-bold truncate">
                              {metrics?.marketCap ? `$${formatNumber(metrics.marketCap)}` : "N/A"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Volume 24h */}
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-500/10 p-1.5 rounded">
                          <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vol 24h</p>
                          {isLoadingMetrics ? (
                            <Skeleton className="h-4 w-12" />
                          ) : (
                            <p className="text-sm font-bold truncate">
                              {metrics?.volume24h ? `$${formatNumber(metrics.volume24h)}` : "N/A"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Holders */}
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-500/10 p-1.5 rounded">
                          <Activity className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Txns</p>
                          {isLoadingMetrics ? (
                            <Skeleton className="h-4 w-12" />
                          ) : (
                            <p className="text-sm font-bold truncate">
                              {metrics?.txns24h ? formatNumber(metrics.txns24h) : "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2.5">
                      <span className="text-muted-foreground">Token Address</span>
                      <a
                        href={`https://basescan.org/token/${track.coin_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium touch-manipulation"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2.5">
                      <span className="text-muted-foreground">Token Details</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(track)}
                        className="text-primary hover:underline h-auto p-0 font-medium touch-manipulation"
                      >
                        View Details
                      </Button>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 glass-premium hover:bg-background border-border/50 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed hover-lift bg-transparent"
                        onClick={() => handlePlay(track)}
                        disabled={!track.audio_url || track.audio_url.trim() === ""}
                        title={
                          !track.audio_url || track.audio_url.trim() === ""
                            ? "Audio not available for this track"
                            : "Play track"
                        }
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button
                        className="flex-1 h-11 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary/70 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 touch-manipulation"
                        onClick={() => handleSwapClick(track)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Swap
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 glass-premium hover:bg-background border-border/50 touch-manipulation hover-lift bg-transparent"
                        onClick={() => handleLiquidityClick(track)}
                        title="Add Liquidity"
                      >
                        <Droplet className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Token Detail Modal */}
      {/* <TokenDetailModal token={detailToken} onClose={() => setDetailToken(null)} /> */}
      <TokenDetailDrawer token={detailToken} open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen} />

      {/* Swap Drawer Sheet */}
      <Sheet open={!!selectedTrack} onOpenChange={handleSwapSheetChange}>
        <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-y-auto">
          <SheetHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-4">
              {selectedTrack && (
                <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={selectedTrack.cover_url || "/placeholder.svg?height=64&width=64"}
                    alt={selectedTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl truncate">Swap for {selectedTrack?.title}</SheetTitle>
                <SheetDescription className="truncate">
                  Trade ETH for {selectedTrack?.title} tokens on Uniswap V3
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            {/* Pool Status */}
            {isCheckingPool ? (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Checking pool availability...</p>
                </CardContent>
              </Card>
            ) : quoteError ? (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{quoteError}</p>
                </CardContent>
              </Card>
            ) : poolInfo ? (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Pool found with {poolInfo.fee / 10000}% fee tier
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Swap Form */}
            <div className="space-y-4">
              {/* From (ETH) */}
              <div className="space-y-2">
                <Label htmlFor="swap-amount" className="text-sm font-medium">
                  You Pay
                </Label>
                <div className="relative">
                  <Input
                    id="swap-amount"
                    type="number"
                    placeholder="0.0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    disabled={!poolInfo || isSwapping}
                    className="h-14 text-lg pr-20"
                    step="0.001"
                    min="0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">ETH</span>
                  </div>
                </div>

                {/* Preset Amounts */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapAmount("0.001")}
                    disabled={!poolInfo || isSwapping}
                    className="h-9"
                  >
                    <Coins className="h-3 w-3 mr-1.5 text-orange-500" />
                    Copper
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapAmount("0.01")}
                    disabled={!poolInfo || isSwapping}
                    className="h-9"
                  >
                    <Coins className="h-3 w-3 mr-1.5 text-gray-400" />
                    Silver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapAmount("0.1")}
                    disabled={!poolInfo || isSwapping}
                    className="h-9"
                  >
                    <Coins className="h-3 w-3 mr-1.5 text-yellow-500" />
                    Gold
                  </Button>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="bg-muted rounded-full p-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                </div>
              </div>

              {/* To (Token) */}
              <div className="space-y-2">
                <Label htmlFor="swap-output" className="text-sm font-medium">
                  You Receive (estimated)
                </Label>
                <div className="relative">
                  <Input
                    id="swap-output"
                    type="text"
                    placeholder="0.0"
                    value={swapOutput}
                    disabled
                    className="h-14 text-lg pr-32 bg-muted/50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground truncate max-w-[100px]">
                      {selectedTrack?.title.substring(0, 10)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Info */}
              {selectedTrack && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Token Address</span>
                      <a
                        href={`https://basescan.org/token/${selectedTrack.coin_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-mono text-xs"
                      >
                        {selectedTrack.coin_address.slice(0, 6)}...{selectedTrack.coin_address.slice(-4)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Artist</span>
                      <span className="font-medium">{selectedTrack.artist_name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Swap Button */}
              <Button
                className="w-full h-12 text-base bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary/70 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
                onClick={() => selectedTrack && handleSwap(selectedTrack)}
                disabled={!poolInfo || !swapAmount || !swapOutput || isSwapping || !!quoteError}
              >
                {isSwapping ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Swap Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {selectedLiquidityToken && (
        <AddLiquidityDrawer
          open={liquidityDrawerOpen}
          onOpenChange={handleLiquidityDrawerChange}
          tokenAddress={selectedLiquidityToken.coin_address}
          tokenName={selectedLiquidityToken.title}
          tokenSymbol={selectedLiquidityToken.title.substring(0, 6).toUpperCase()}
          tokenImage={selectedLiquidityToken.cover_url}
        />
      )}
    </div>
  )
}
