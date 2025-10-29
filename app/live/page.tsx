"use client"

import { useEffect, useState } from "react"
import { LiveStreamCard } from "@/components/live-stream-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radio, Plus, Sparkles, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/lib/web3/wallet-context"
import { SkeletonCard } from "@/components/skeleton-loader"

interface LiveStream {
  id: string
  title: string
  description?: string
  is_live: boolean
  viewer_count: number
  playback_id: string
  artist: {
    artist_name: string
    avatar_url?: string
    wallet_address: string
  }
}

export default function LivePage() {
  const { address, isConnected } = useWallet()
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [allStreams, setAllStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)
  const [isEligible, setIsEligible] = useState(false)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  useEffect(() => {
    async function loadStreams() {
      try {
        console.log("[v0] Loading streams...")

        // Fetch live streams
        const liveRes = await fetch("/api/live/streams?live=true")
        if (!liveRes.ok) {
          console.error("[v0] Live streams fetch failed:", liveRes.status)
          setLiveStreams([])
        } else {
          const liveData = await liveRes.json()
          // Ensure we have an array
          const liveArray = Array.isArray(liveData) ? liveData : []
          console.log("[v0] Live streams loaded:", liveArray.length)
          setLiveStreams(liveArray)
        }

        // Fetch all recent streams
        const allRes = await fetch("/api/live/streams")
        if (!allRes.ok) {
          console.error("[v0] All streams fetch failed:", allRes.status)
          setAllStreams([])
        } else {
          const allData = await allRes.json()
          // Ensure we have an array
          const allArray = Array.isArray(allData) ? allData : []
          console.log("[v0] All streams loaded:", allArray.length)
          const recentStreams = allArray.filter((stream: LiveStream) => !stream.is_live)
          setAllStreams(recentStreams)
        }
      } catch (error) {
        console.error("[v0] Error loading streams:", error)
        setLiveStreams([])
        setAllStreams([])
      } finally {
        setLoading(false)
      }
    }

    loadStreams()

    // Refresh every 30 seconds
    const interval = setInterval(loadStreams, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function checkEligibility() {
      if (!address) {
        setIsEligible(false)
        return
      }

      setCheckingEligibility(true)
      try {
        const res = await fetch(`/api/live/check-eligibility?address=${address}`)
        const data = await res.json()
        setIsEligible(data.eligible)
      } catch (error) {
        console.error("[v0] Error checking eligibility:", error)
      } finally {
        setCheckingEligibility(false)
      }
    }

    checkEligibility()
  }, [address])

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-b from-black via-black to-background">
      {/* Hero Section */}
      <main className="container py-12 px-4 sm:px-6">
        <div className="mb-12 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full animate-pulse" />
                  <Radio className="h-10 w-10 text-red-500 relative" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Live Streams
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Watch live performances, connect with artists in real-time, and experience music like never before
              </p>
            </div>

            {isConnected && (
              <Button
                size="lg"
                asChild
                className="relative group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:scale-105"
              >
                <Link href="/live/start">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Plus className="h-5 w-5 mr-2" />
                  Go Live
                  {isEligible && <Sparkles className="h-4 w-4 ml-2 text-yellow-300 animate-pulse" />}
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          {(liveStreams.length > 0 || allStreams.length > 0) && (
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-card/30 backdrop-blur-xl border border-border/50">
              {liveStreams.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium">{liveStreams.length} Live Now</span>
                </div>
              )}
              {allStreams.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border/50" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">{allStreams.length} Recent</span>
                  </div>
                </>
              )}
              {liveStreams.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border/50" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{liveStreams.reduce((acc, s) => acc + s.viewer_count, 0)} Watching</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Live Now Section */}
        {liveStreams.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/25 px-3 py-1.5">
                <Radio className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                LIVE NOW
              </Badge>
              <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 via-red-500/20 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveStreams.map((stream, i) => (
                <div key={stream.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <LiveStreamCard stream={stream} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Streams */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">Recent Streams</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : allStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allStreams.map((stream, i) => (
                <div key={stream.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <LiveStreamCard stream={stream} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-full p-8">
                  <Radio className="h-16 w-16 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">No streams yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Be the first to go live and share your music with the world
              </p>
              {isConnected && isEligible && (
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  <Link href="/live/start">
                    <Plus className="h-5 w-5 mr-2" />
                    Start Streaming
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
