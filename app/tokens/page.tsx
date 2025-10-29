"use client"

import { useState, useEffect, useMemo } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenDetailModal } from "@/components/token-detail-modal"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AddLiquidityDrawer } from "@/components/add-liquidity-drawer"
import {
  Play,
  Pause,
  Coins,
  TrendingUp,
  ExternalLink,
  Search,
  Loader2,
  Music,
  Zap,
  Info,
  AlertCircle,
  Droplet,
  Heart,
  X,
  BarChart3,
  Activity,
  Sparkles,
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set())
  const [liquidityDrawerOpen, setLiquidityDrawerOpen] = useState(false)
  const [selectedLiquidityToken, setSelectedLiquidityToken] = useState<TokenizedTrack | null>(null)

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

      const formattedTracks = data.map((track: any) => ({
        ...track,
        artist_name: track.profiles?.artist_name || "Unknown Artist",
      }))

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
    if (currentTrack?.id === track.id && isPlaying) {
      pause()
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist_name,
        artist_id: track.artist_id,
        audioUrl: track.audio_url,
        coverUrl: track.cover_url,
        duration: track.duration,
        pricePerChunk: track.price_per_chunk,
      })
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
    if (!isConnected) {
      addToast({
        title: "Wallet Required",
        description: "Please connect your wallet to swap tokens",
        variant: "default",
      })
      connect()
      return
    }
    setSelectedTrack(track)
  }

  const filteredTracks = useMemo(() => {
    return tracks.filter(
      (track) =>
        (track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!showFilters || favorites.has(track.id)),
    )
  }, [tracks, searchQuery, showFilters, favorites])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl space-y-6 sm:space-y-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary to-primary/50 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                  <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-balance">
                  Tokenized Music
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Stream, trade, and provide liquidity for tokenized songs on Base
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg">
                  <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalTokens}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Tokens</p>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="bg-red-500/10 p-1.5 sm:p-2 rounded-lg">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalFavorites}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Favorites</p>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="bg-green-500/10 p-1.5 sm:p-2 rounded-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.recentlyAdded}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Added 24h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tracks or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex gap-2 min-w-max sm:min-w-0">
              <Button
                variant={sortBy === "trending" ? "default" : "outline"}
                onClick={() => setSortBy("trending")}
                className="gap-2 h-10 sm:h-12 whitespace-nowrap"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Button>
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                onClick={() => setSortBy("recent")}
                className="gap-2 h-10 sm:h-12 whitespace-nowrap"
              >
                <Activity className="h-4 w-4" />
                Recent
              </Button>
              <Button
                variant={sortBy === "popular" ? "default" : "outline"}
                onClick={() => setSortBy("popular")}
                className="gap-2 h-10 sm:h-12 whitespace-nowrap"
              >
                <BarChart3 className="h-4 w-4" />
                Popular
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 h-10 sm:h-12 whitespace-nowrap"
              >
                <Heart className="h-4 w-4" />
                Favorites
                {favorites.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
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
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
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
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {!imagesLoaded.has(track.id) && <Skeleton className="absolute inset-0" />}
                  <img
                    src={track.cover_url || "/placeholder.svg?height=400&width=400"}
                    alt={track.title}
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                      imagesLoaded.has(track.id) ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setImagesLoaded((prev) => new Set(prev).add(track.id))}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                  <Button
                    size="icon"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 bg-primary/90 hover:bg-primary backdrop-blur-sm shadow-2xl shadow-primary/50"
                    onClick={() => handlePlay(track)}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300"
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
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1 text-lg">{track.title}</CardTitle>
                  <CardDescription className="line-clamp-1 flex items-center gap-2">
                    {track.artist_name}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
                    <span className="text-muted-foreground">Token Address</span>
                    <a
                      href={`https://basescan.org/token/${track.coin_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
                    <span className="text-muted-foreground">Token Details</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailToken(track)}
                      className="text-primary hover:underline h-auto p-0 font-medium"
                    >
                      View Details
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-background/50 hover:bg-background border-border/50"
                      onClick={() => handlePlay(track)}
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
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                      onClick={() => handleSwapClick(track)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Swap
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-background/50 hover:bg-background border-border/50"
                      onClick={() => {
                        if (!isConnected) {
                          addToast({
                            title: "Wallet Required",
                            description: "Please connect your wallet to add liquidity",
                            variant: "default",
                          })
                          connect()
                          return
                        }
                        setSelectedLiquidityToken(track)
                        setLiquidityDrawerOpen(true)
                      }}
                      title="Add Liquidity"
                    >
                      <Droplet className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTrack && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-primary to-primary/50 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg">Swap for {selectedTrack.title}</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      Exchange ETH for track tokens via Uniswap V3
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {isCheckingPool ? (
                  <div className="flex items-center gap-3 text-sm bg-muted/50 rounded-xl p-4 border border-border/50">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Checking Uniswap V3 pools...</span>
                  </div>
                ) : poolInfo ? (
                  <div className="flex items-center gap-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">Pool found with {(poolInfo.fee / 10000).toFixed(2)}% fee</span>
                  </div>
                ) : quoteError ? (
                  <div className="flex items-start gap-3 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium">{quoteError}</p>
                      <p className="text-xs">
                        Add liquidity on{" "}
                        <a
                          href="https://app.uniswap.org/add"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-amber-700 font-medium"
                        >
                          Uniswap
                        </a>
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="swap-amount" className="text-sm font-medium">
                    Amount (ETH)
                  </Label>
                  <Input
                    id="swap-amount"
                    type="number"
                    placeholder="0.0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="text-lg h-14 bg-background/50 border-border/50 focus:border-primary/50"
                    disabled={!poolInfo}
                  />
                </div>

                {swapOutput && (
                  <div className="space-y-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                    <Label className="text-sm font-medium text-muted-foreground">You will receive (estimated)</Label>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {Number.parseFloat(swapOutput).toFixed(2)} tokens
                    </div>
                  </div>
                )}

                {poolInfo && swapOutput && (
                  <div className="rounded-xl bg-muted/50 p-4 space-y-3 text-sm border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        1 ETH ≈ {(Number.parseFloat(swapOutput) / Number.parseFloat(swapAmount)).toFixed(2)} tokens
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pool Fee</span>
                      <span className="font-medium">{(poolInfo.fee / 10000).toFixed(2)}%</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleSwap(selectedTrack)}
                    disabled={
                      !swapAmount || !poolInfo || !swapOutput || Number.parseFloat(swapAmount) <= 0 || isSwapping
                    }
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                  >
                    {isSwapping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Swapping...
                      </>
                    ) : !poolInfo ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        No Pool Available
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Swap Now
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTrack(null)
                      setPoolInfo(null)
                      setSwapAmount("")
                      setSwapOutput("")
                      setQuoteError(null)
                    }}
                    disabled={isSwapping}
                    className="h-12 bg-background/50"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="flex items-start gap-3 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Swaps use Uniswap V3 on Base network with live on-chain pricing. The system automatically detects
                    available pools across all fee tiers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Token Detail Modal */}
        {detailToken && <TokenDetailModal token={detailToken} onClose={() => setDetailToken(null)} />}

        {selectedLiquidityToken && (
          <AddLiquidityDrawer
            open={liquidityDrawerOpen}
            onOpenChange={setLiquidityDrawerOpen}
            tokenAddress={selectedLiquidityToken.coin_address}
            tokenName={selectedLiquidityToken.title}
            tokenSymbol={selectedLiquidityToken.title.substring(0, 6).toUpperCase()}
            tokenImage={selectedLiquidityToken.cover_url}
          />
        )}
      </div>
    </div>
  )
}
