"use client"

import { TrackCard } from "@/components/track-card"
import { Button } from "@/components/ui/button"
import { UserPlus, Heart, AlertCircle } from "lucide-react"
import type { TrackWithArtist } from "@/types/database"
import { useEffect, useState } from "react"
import { SkeletonCard } from "@/components/skeleton-loader"
import Link from "next/link"
import { useAccount } from "wagmi"

type TrackWithStats = TrackWithArtist & {
  total_earned?: number
  play_count?: number
  like_count?: number
}

export default function FollowingPage() {
  const { address, isConnected } = useAccount()
  const [tracks, setTracks] = useState<TrackWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] Following page mounted")
    console.log("[v0] Wallet connected:", isConnected)
    console.log("[v0] Wallet address:", address)

    if (isConnected && address) {
      loadFollowingFeed()
    } else {
      setLoading(false)
    }
  }, [address, isConnected])

  async function loadFollowingFeed() {
    if (!address) return

    console.log("[v0] Loading following feed for address:", address)

    setLoading(true)
    setError(null)

    try {
      const url = `/api/following?address=${address}`
      console.log("[v0] Fetching from:", url)

      const response = await fetch(url)
      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        throw new Error("Failed to load following feed")
      }

      const data = await response.json()
      console.log("[v0] Received data:", data)
      console.log("[v0] Number of tracks:", data.tracks?.length || 0)

      setTracks(data.tracks || [])
    } catch (error) {
      console.error("[v0] Failed to load following feed:", error)
      setError("Failed to load your following feed. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black pb-32">
        <main className="container py-12 px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-foreground/70 mb-6 max-w-md">
              Connect your wallet to see tracks from artists you follow
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black pb-32">
        <main className="container py-12 px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-2xl font-bold mb-2">Something went wrong</h3>
            <p className="text-foreground/70 mb-6">{error}</p>
            <Button size="lg" className="rounded-full" onClick={loadFollowingFeed}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Empty state - not following anyone
  if (!loading && tracks.length === 0) {
    return (
      <div className="min-h-screen bg-black pb-32">
        <main className="container py-12 px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Following</h1>
            <p className="text-foreground/70">Tracks from artists you follow</p>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold mb-2">No tracks yet</h3>
            <p className="text-foreground/70 mb-6 max-w-md">Start following artists to see their latest tracks here</p>
            <Link href="/artists">
              <Button size="lg" className="rounded-full">
                <UserPlus className="h-5 w-5 mr-2" />
                Discover Artists
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <main className="container py-12 px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Following</h1>
            <p className="text-foreground/70">
              {loading
                ? "Loading..."
                : `${tracks.length} track${tracks.length === 1 ? "" : "s"} from artists you follow`}
            </p>
          </div>
          <Link href="/artists">
            <Button variant="outline" className="rounded-full bg-transparent">
              <UserPlus className="h-4 w-4 mr-2" />
              Find Artists
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Tracks Grid */}
        {!loading && tracks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} queue={tracks} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
