"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, ExternalLink, Zap, Loader2, AlertCircle, Info, Flag, ArrowLeftRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PlayTrackButton } from "@/components/play-track-button"
import { LikeButton } from "@/components/like-button"
import { ReportTrackDialog } from "@/components/report-track-dialog"
import { TrackAnalyticsCharts } from "@/components/track-analytics-charts"
import { VideoPlayer } from "@/components/video-player"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/lib/web3/wallet-context"
import { useWriteContract, usePublicClient } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import useSWR from "swr"
import {
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
} from "@/lib/web3/contracts"
import confetti from "canvas-confetti"
import { TrackComments } from "@/components/track-comments"
import { SimilarTracks } from "@/components/similar-tracks"

const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006",
  84532: "0x4200000000000000000000000000000000000006",
} as const

interface TrackDetailContentProps {
  track: any
  likeCount: number
  totalPlays: number
  totalEarned: number
  streamData: any[]
  uniqueListeners: number
  avgSegmentsPerStream: number
  totalStreams: number
  avgEarningsPerStream: number
}

export function TrackDetailContent({
  track,
  likeCount,
  totalPlays,
  totalEarned,
  streamData,
  uniqueListeners,
  avgSegmentsPerStream,
  totalStreams,
  avgEarningsPerStream,
}: TrackDetailContentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [statsVisible, setStatsVisible] = useState(false)
  const [analyticsVisible, setAnalyticsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const analyticsRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { address, isConnected, chainId, connect } = useWallet()
  const [swapDrawerOpen, setSwapDrawerOpen] = useState(false)
  const [swapAmount, setSwapAmount] = useState("")
  const [swapOutput, setSwapOutput] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [poolInfo, setPoolInfo] = useState<{ address: string; fee: number } | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)

  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const isTokenized = !!track.coin_address

  const { data: tokenMetrics } = useSWR(
    isTokenized ? `/api/token/metrics/${track.coin_address}` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch token metrics")
      return res.json()
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    },
  )

  useEffect(() => {
    setIsVisible(true)
    setStatsVisible(true)
    setAnalyticsVisible(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === statsRef.current) {
              setStatsVisible(true)
            }
            if (entry.target === analyticsRef.current) {
              setAnalyticsVisible(true)
            }
          }
        })
      },
      { threshold: 0.1 },
    )

    if (statsRef.current) observer.observe(statsRef.current)
    if (analyticsRef.current) observer.observe(analyticsRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (swapDrawerOpen && isTokenized && chainId) {
      checkPoolAvailability(track.coin_address)
    }
  }, [swapDrawerOpen, chainId])

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
    if (swapAmount && poolInfo && chainId && isTokenized) {
      fetchQuote()
    } else {
      setSwapOutput("")
    }
  }, [swapAmount, poolInfo, chainId])

  const fetchQuote = async () => {
    if (!swapAmount || !poolInfo || !chainId || !publicClient || !isTokenized) return

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
            tokenOut: track.coin_address as `0x${string}`,
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

  const handleSwap = async () => {
    if (!address || !chainId || !swapAmount || !poolInfo || !isTokenized) return

    setIsSwapping(true)
    try {
      const amountIn = parseUnits(swapAmount, 18)
      const tokenOut = track.coin_address as `0x${string}`
      const tokenIn = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] as `0x${string}`

      toast({
        title: "Swap Pending",
        description: "Please confirm the swap in your wallet...",
      })

      await writeContractAsync({
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

      toast({
        title: "Swap Successful!",
        description: `Successfully swapped ${swapAmount} ETH for ${track.title} tokens`,
      })

      setSwapAmount("")
      setSwapOutput("")
      setSwapDrawerOpen(false)
    } catch (error: any) {
      console.error("[v0] Swap failed:", error)
      toast({
        title: "Swap Failed",
        description: error.message?.includes("User rejected") ? "Transaction rejected" : "Failed to execute swap",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  const handleBuyClick = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to buy tokens",
      })
      connect()
      return
    }
    setSwapDrawerOpen(true)
  }

  const handleShare = async () => {
    const shareData = {
      title: track.title,
      text: `Check out "${track.title}" on ANTI Platform`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Track link copied to clipboard",
      })
    }
  }

  const handleVideoPaymentRequired = (chunk: number) => {
    // This will be handled by the video player's payment integration
    console.log("[v0] Payment required for video chunk:", chunk)
  }

  const coverUrl = track.content_type === "video" ? track.thumbnail_url : track.cover_url
  const isGif = coverUrl?.toLowerCase().endsWith(".gif")

  return (
    <div className="min-h-screen pb-32 overflow-x-hidden relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${track.cover_url || "/abstract-soundscape.png"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Blur layer */}
        <div className="absolute inset-0 backdrop-blur-[100px]" style={{ filter: "blur(80px)" }} />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
      </div>

      <main className="container py-6 px-4 sm:py-12 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 lg:gap-8">
          <div
            className={`space-y-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {track.content_type === "video" && track.video_url ? (
              <div className="rounded-xl overflow-hidden max-w-full">
                <VideoPlayer
                  videoUrl={track.video_url}
                  thumbnailUrl={track.thumbnail_url}
                  title={track.title}
                  pricePerChunk={track.price_per_chunk}
                  unlockType={track.unlock_type}
                  trackId={track.id}
                  onPaymentRequired={handleVideoPaymentRequired}
                />
              </div>
            ) : (
              <div
                className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-card/50 to-accent/20 backdrop-blur-xl border border-border/50 group"
                style={{
                  transform: `translateY(${scrollY * 0.15}px) scale(${1 - scrollY * 0.0002})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {isGif ? (
                  <img
                    src={coverUrl || "/placeholder.svg?height=400&width=400&query=album cover"}
                    alt={track.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <Image
                    src={coverUrl || "/placeholder.svg?height=400&width=400&query=album cover"}
                    alt={track.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                )}

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary/30 to-transparent blur-2xl" />
              </div>
            )}

            <div
              className={`flex gap-3 transition-all duration-700 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {track.content_type === "audio" && (
                <PlayTrackButton
                  track={track}
                  className="flex-1 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                />
              )}
              {isTokenized && (
                <Button
                  onClick={handleBuyClick}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary/70 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                >
                  <ArrowLeftRight className="h-5 w-5 mr-2" />
                  Swap
                </Button>
              )}
              <LikeButton
                trackId={track.id}
                initialLikeCount={likeCount || 0}
                size="lg"
                className="hover:scale-110 transition-transform duration-300"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={handleShare}
                className="bg-transparent hover:bg-primary/10 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowReportDialog(true)}
                className="bg-transparent hover:bg-red-500/10 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300"
              >
                <Flag className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <div
              className={`transition-all duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent break-words">
                {track.title}
              </h1>
              <Link href={`/artist/${track.artist_id}`}>
                <div className="flex items-center gap-3 group">
                  <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary transition-all duration-300 group-hover:scale-110">
                    <AvatarImage src={track.artist?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {track.artist?.artist_name?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {track.artist?.artist_name || "Anonymous Artist"}
                    </p>
                    <p className="text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors">
                      {formatAddress(track.artist_id)}
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div
              ref={statsRef}
              className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-700 ${
                statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-gray-400 mb-1 group-hover:text-primary transition-colors">Price per play</p>
                <p className="text-2xl font-bold text-white">{track.price_per_chunk} USDC</p>
              </Card>
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-gray-400 mb-1 group-hover:text-primary transition-colors">Total plays</p>
                <AnimatedCounter value={totalPlays} />
              </Card>
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-gray-400 mb-1 group-hover:text-primary transition-colors">Total earned</p>
                <p className="text-2xl font-bold text-white animate-green-glow">{totalEarned.toFixed(2)} USDC</p>
              </Card>
            </div>

            {isTokenized && tokenMetrics && (tokenMetrics.price > 0 || tokenMetrics.marketCap > 0) && (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 ${
                  statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-xl border border-primary/30 p-4 hover:bg-primary/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 group">
                  <p className="text-sm text-gray-400 mb-1 group-hover:text-primary transition-colors">Token Price</p>
                  <p className="text-2xl font-bold text-primary">
                    ${tokenMetrics.price > 0 ? tokenMetrics.price.toFixed(6) : "0.000000"}
                  </p>
                  {tokenMetrics.priceChange24h !== 0 && (
                    <p
                      className={`text-sm mt-1 ${tokenMetrics.priceChange24h > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {tokenMetrics.priceChange24h > 0 ? "+" : ""}
                      {tokenMetrics.priceChange24h.toFixed(2)}% (24h)
                    </p>
                  )}
                </Card>
                <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-xl border border-primary/30 p-4 hover:bg-primary/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 group">
                  <p className="text-sm text-gray-400 mb-1 group-hover:text-primary transition-colors">Market Cap</p>
                  <p className="text-2xl font-bold text-primary">
                    {tokenMetrics.marketCap > 0
                      ? tokenMetrics.marketCap >= 1000000
                        ? `$${(tokenMetrics.marketCap / 1000000).toFixed(2)}M`
                        : `$${(tokenMetrics.marketCap / 1000).toFixed(2)}K`
                      : "$0"}
                  </p>
                  {tokenMetrics.volume24h > 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      Vol: $
                      {tokenMetrics.volume24h >= 1000
                        ? `${(tokenMetrics.volume24h / 1000).toFixed(1)}K`
                        : tokenMetrics.volume24h.toFixed(0)}
                    </p>
                  )}
                </Card>
              </div>
            )}

            {streamData && streamData.length > 0 && (
              <div
                ref={analyticsRef}
                className={`space-y-6 transition-all duration-700 ${
                  analyticsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Analytics
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Unique Listeners", value: uniqueListeners, color: "text-accent" },
                    { label: "Total Streams", value: totalStreams, color: "text-accent" },
                    { label: "Avg. Segments", value: avgSegmentsPerStream.toFixed(1), color: "text-accent" },
                    {
                      label: "Avg. per Stream",
                      value: `${avgEarningsPerStream.toFixed(4)} USDC`,
                      color: "text-primary",
                    },
                  ].map((stat, index) => (
                    <Card
                      key={stat.label}
                      className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <p className="text-sm text-gray-400 mb-1 group-hover:text-primary transition-colors">
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold ${stat.color === "text-accent" ? "text-white" : stat.color}`}>
                        {stat.value}
                      </p>
                    </Card>
                  ))}
                </div>

                <div className="max-w-full overflow-hidden">
                  <TrackAnalyticsCharts data={streamData} tokenAddress={track.coin_address} />
                </div>
              </div>
            )}

            {track.nft_contract_address && (
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                  NFT Details
                  <ExternalLink className="h-4 w-4 text-foreground/60" />
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Contract</span>
                    <span className="font-mono text-foreground">{formatAddress(track.nft_contract_address)}</span>
                  </div>
                  {track.token_id && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Token ID</span>
                      <span className="font-mono text-foreground">#{track.token_id}</span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full mt-4 bg-transparent hover:bg-primary/10 hover:scale-105 transition-all duration-300"
                  variant="outline"
                >
                  Collect NFT
                </Button>
              </Card>
            )}

            {track.royalty_splits && track.royalty_splits.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <h3 className="font-semibold mb-4 text-foreground">Royalty Splits</h3>
                <div className="space-y-3">
                  {track.royalty_splits.map((split: any) => (
                    <div
                      key={split.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 transition-colors duration-200"
                    >
                      <span className="text-sm font-mono text-foreground/80">
                        {formatAddress(split.recipient_address)}
                      </span>
                      <span className="text-sm font-semibold text-primary">{split.share_percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <TrackComments trackId={track.id} />
        </div>
      </main>

      <div className="container max-w-7xl mx-auto px-4 py-8 relative z-10">
        <SimilarTracks trackId={track.id} />
      </div>

      <Sheet open={swapDrawerOpen} onOpenChange={setSwapDrawerOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] sm:h-auto sm:max-w-lg sm:mx-auto sm:my-8 sm:rounded-2xl overflow-hidden p-0 border-t-4 border-primary/50"
        >
          <div className="h-full flex flex-col">
            <SheetHeader className="border-b border-border/50 pb-5 pt-6 px-6 bg-gradient-to-b from-card/50 to-transparent backdrop-blur-sm">
              <SheetTitle className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-lg rounded-lg animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary via-primary to-primary/70 p-2.5 rounded-xl shadow-lg shadow-primary/30">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Buy {track.title}
                  </div>
                  <SheetDescription className="text-sm mt-1">
                    Exchange ETH for track tokens via Uniswap V3
                  </SheetDescription>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {isCheckingPool ? (
                <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-muted/80 to-muted/40 rounded-2xl p-4 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="relative">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
                  </div>
                  <span className="font-medium">Checking Uniswap V3 pools...</span>
                </div>
              ) : poolInfo ? (
                <div className="flex items-center gap-3 text-sm text-green-600 bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-2xl p-4 shadow-lg shadow-green-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                    <div className="absolute inset-0 bg-green-500/50 blur-sm rounded-full animate-pulse" />
                  </div>
                  <span className="font-semibold">Pool found with {(poolInfo.fee / 10000).toFixed(2)}% fee</span>
                </div>
              ) : quoteError ? (
                <div className="flex items-start gap-3 text-sm text-amber-600 bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg shadow-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">{quoteError}</p>
                    <p className="text-xs">
                      Add liquidity on{" "}
                      <a
                        href="https://app.uniswap.org/add"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-amber-700 font-semibold transition-colors"
                      >
                        Uniswap
                      </a>
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <Label htmlFor="swap-amount" className="text-sm font-semibold text-foreground/90">
                  Amount (ETH)
                </Label>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapAmount("0.001")}
                    disabled={!poolInfo}
                    className="h-12 bg-gradient-to-br from-[#B87333] via-[#CD7F32] to-[#B87333] hover:from-[#A0632C] hover:via-[#B87333] hover:to-[#A0632C] text-white border-0 shadow-lg hover:shadow-xl hover:shadow-[#B87333]/30 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                  >
                    <span className="text-xs font-bold group-hover:scale-110 transition-transform duration-300">
                      0.001 ETH
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapAmount("0.01")}
                    disabled={!poolInfo}
                    className="h-12 bg-gradient-to-br from-[#C0C0C0] via-[#E8E8E8] to-[#A8A9AD] hover:from-[#B0B0B0] hover:via-[#D8D8D8] hover:to-[#989999] text-gray-900 border-0 shadow-lg hover:shadow-xl hover:shadow-gray-400/30 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                  >
                    <span className="text-xs font-bold group-hover:scale-110 transition-transform duration-300">
                      0.01 ETH
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapAmount("0.1")}
                    disabled={!poolInfo}
                    className="h-12 bg-gradient-to-br from-[#FFD700] via-[#FFED4E] to-[#FFA500] hover:from-[#F0C800] hover:via-[#FFE838] hover:to-[#FF9500] text-gray-900 border-0 shadow-lg hover:shadow-xl hover:shadow-yellow-400/30 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                  >
                    <span className="text-xs font-bold group-hover:scale-110 transition-transform duration-300">
                      0.1 ETH
                    </span>
                  </Button>
                </div>

                <div className="relative">
                  <Input
                    id="swap-amount"
                    type="number"
                    placeholder="0.0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="text-xl h-16 bg-gradient-to-br from-background to-background/50 border-2 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 rounded-xl shadow-inner"
                    disabled={!poolInfo}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ETH
                  </div>
                </div>
              </div>

              {swapOutput && (
                <div className="space-y-3 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl p-5 border-2 border-primary/30 shadow-xl shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Label className="text-sm font-semibold text-muted-foreground">You will receive (estimated)</Label>
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent animate-in zoom-in duration-700">
                    {Number.parseFloat(swapOutput).toFixed(2)} tokens
                  </div>
                </div>
              )}

              {poolInfo && swapOutput && (
                <div className="rounded-2xl bg-gradient-to-r from-muted/80 to-muted/40 p-5 space-y-4 text-sm border border-border/50 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Rate</span>
                    <span className="font-bold text-foreground">
                      1 ETH ≈ {(Number.parseFloat(swapOutput) / Number.parseFloat(swapAmount)).toFixed(2)} tokens
                    </span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Pool Fee</span>
                    <span className="font-bold text-foreground">{(poolInfo.fee / 10000).toFixed(2)}%</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 text-sm bg-gradient-to-r from-blue-500/15 to-blue-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-lg shadow-blue-500/10">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-foreground/80 leading-relaxed">
                  Swaps use Uniswap V3 on Base network with live on-chain pricing. The system automatically detects
                  available pools across all fee tiers.
                </p>
              </div>
            </div>

            <div className="border-t border-border/50 p-6 bg-gradient-to-t from-card/50 to-transparent backdrop-blur-sm">
              <div className="flex gap-3">
                <Button
                  onClick={handleSwap}
                  disabled={!swapAmount || !poolInfo || !swapOutput || Number.parseFloat(swapAmount) <= 0 || isSwapping}
                  className="flex-1 h-14 text-base font-bold bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary/70 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSwapping ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Swapping...
                    </>
                  ) : !poolInfo ? (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2" />
                      No Pool Available
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSwapDrawerOpen(false)}
                  disabled={isSwapping}
                  className="h-14 px-8 text-base font-semibold bg-background/50 hover:bg-background border-2 border-border/50 hover:border-border transition-all duration-300 hover:scale-[1.02] active:scale-95"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ReportTrackDialog
        trackId={track.id}
        trackTitle={track.title}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </div>
  )
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return <p className="text-2xl font-bold text-white">{count}</p>
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
