"use client"

import { useEffect, useState } from "react"
import { LiveStreamCard } from "@/components/live-stream-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radio, Plus, Sparkles } from "lucide-react"
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
        const liveData = await liveRes.json()
        console.log("[v0] Live streams loaded:", liveData.length)
        setLiveStreams(liveData)

        // Fetch all recent streams
        const allRes = await fetch("/api/live/streams")
        const allData = await allRes.json()
        console.log("[v0] All streams loaded:", allData.length)
        const recentStreams = allData.filter((stream: LiveStream) => !stream.is_live)
        setAllStreams(recentStreams)
      } catch (error) {
        console.error("[v0] Error loading streams:", error)
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
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Radio className="h-8 w-8 text-red-500" />
              <h1 className="text-4xl font-bold">Live Streams</h1>
            </div>
            <p className="text-muted-foreground">Watch live performances from your favorite artists</p>
          </div>

          {isConnected && (
            <Button size="lg" asChild className="relative">
              <Link href="/live/start">
                <Plus className="h-5 w-5 mr-2" />
                Go Live
                {isEligible && <Sparkles className="h-4 w-4 ml-2 text-yellow-400" />}
              </Link>
            </Button>
          )}
        </div>

        {/* Live Now Section */}
        {liveStreams.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Badge className="bg-red-500 text-white border-0 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE NOW
              </Badge>
              <span className="text-sm text-muted-foreground">
                {liveStreams.length} {liveStreams.length === 1 ? "stream" : "streams"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveStreams.map((stream, i) => (
                <div key={stream.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <LiveStreamCard stream={stream} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Streams */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Streams</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : allStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allStreams.map((stream, i) => (
                <div key={stream.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <LiveStreamCard stream={stream} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No streams yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to go live!</p>
              {isConnected && isEligible && (
                <Button asChild>
                  <Link href="/live/start">
                    <Plus className="h-4 w-4 mr-2" />
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
