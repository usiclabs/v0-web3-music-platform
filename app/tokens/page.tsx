"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenDetailModal } from "@/components/token-detail-modal"
import {
  Play,
  Pause,
  Coins,
  TrendingUp,
  Wallet,
  ExternalLink,
  Search,
  ArrowUpDown,
  Loader2,
  Music,
  Zap,
  Info,
  AlertCircle,
  Droplet,
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
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent")
  const [selectedTrack, setSelectedTrack] = useState<TokenizedTrack | null>(null)
  const [swapAmount, setSwapAmount] = useState("")
  const [swapOutput, setSwapOutput] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [poolInfo, setPoolInfo] = useState<{ address: string; fee: number } | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [detailToken, setDetailToken] = useState<TokenizedTrack | null>(null)

  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

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
    console.log("[v0] Playing track:", {
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      audio_url_type: typeof track.audio_url,
      audio_url_length: track.audio_url?.length,
    })

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
          console.log(`[v0] Found pool for ${tokenAddress} with ${fee / 10000}% fee`)
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

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              <Coins className="h-8 w-8 text-primary" />
              Tokenized Music
            </h1>
            <p className="text-muted-foreground">Stream and trade tokenized songs on Base network</p>
          </div>
          {!isConnected && (
            <Button onClick={connect} variant="outline" className="gap-2 bg-transparent">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              onClick={() => setSortBy("recent")}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Recent
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Popular
            </Button>
          </div>
        </div>
      </div>

      {/* Tracks Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTracks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Music className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Tokenized Tracks Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery
                ? "No tracks match your search. Try different keywords."
                : "No tokenized tracks available yet. Check back soon!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 overflow-hidden"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={track.cover_url || "/placeholder.svg?height=400&width=400"}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Button
                  size="icon"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100"
                  onClick={() => handlePlay(track)}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
                <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Tokenized
                  </span>
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-1">{track.title}</CardTitle>
                <CardDescription className="line-clamp-1">{track.artist_name}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Token Address</span>
                  <a
                    href={`https://basescan.org/token/${track.coin_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Token Details</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailToken(track)}
                    className="text-primary hover:underline h-auto p-0"
                  >
                    View Details
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handlePlay(track)}>
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
                  <Button className="flex-1" onClick={() => handleSwapClick(track)}>
                    <Zap className="h-4 w-4 mr-2" />
                    Swap
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
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
                      window.location.href = `/lp-manager?token=${track.coin_address}`
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

      {/* Swap Modal */}
      {selectedTrack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Swap for {selectedTrack.title}
              </CardTitle>
              <CardDescription>Exchange ETH for track tokens via Uniswap V3</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCheckingPool ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking Uniswap V3 pools...</span>
                </div>
              ) : poolInfo ? (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Pool found with {(poolInfo.fee / 10000).toFixed(2)}% fee</span>
                </div>
              ) : quoteError ? (
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">{quoteError}</p>
                    <p className="text-xs">
                      Add liquidity on{" "}
                      <a
                        href="https://app.uniswap.org/add"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-amber-700"
                      >
                        Uniswap
                      </a>
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="swap-amount">Amount (ETH)</Label>
                <Input
                  id="swap-amount"
                  type="number"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="text-lg h-12"
                  disabled={!poolInfo}
                />
              </div>

              {swapOutput && (
                <div className="space-y-2">
                  <Label>You will receive (estimated)</Label>
                  <div className="text-2xl font-bold text-primary">
                    {Number.parseFloat(swapOutput).toFixed(2)} tokens
                  </div>
                </div>
              )}

              {poolInfo && swapOutput && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">
                      1 ETH ≈ {(Number.parseFloat(swapOutput) / Number.parseFloat(swapAmount)).toFixed(2)} tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pool Fee</span>
                    <span className="font-medium">{(poolInfo.fee / 10000).toFixed(2)}%</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSwap(selectedTrack)}
                  disabled={!swapAmount || !poolInfo || !swapOutput || Number.parseFloat(swapAmount) <= 0 || isSwapping}
                  className="flex-1"
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
                >
                  Cancel
                </Button>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
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
    </div>
  )
}
