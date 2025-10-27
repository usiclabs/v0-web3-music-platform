"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PlayTrackButton } from "@/components/play-track-button"
import { LikeButton } from "@/components/like-button"
import { TrackAnalyticsCharts } from "@/components/track-analytics-charts"
import { VideoPlayer } from "@/components/video-player"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

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

  return (
    <div className="min-h-screen pb-32 overflow-x-hidden">
      <main className="container py-6 px-4 sm:py-12 sm:px-6">
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

                <Image
                  src={track.cover_url || "/placeholder.svg?height=400&width=400&query=album cover"}
                  alt={track.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority
                />

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
                  <TrackAnalyticsCharts data={streamData} />
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
      </main>
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
