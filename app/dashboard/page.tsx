"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, TrendingUp, DollarSign, Upload, Heart, Edit, EyeOff } from "lucide-react"
import Link from "next/link"
import { TrackCard } from "@/components/track-card"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { ensureProfile } from "@/lib/supabase/helpers"
import type { Database } from "@/types/database"
import { SkeletonCard, SkeletonStats } from "@/components/skeleton-loader"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"

type Track = Database["public"]["Tables"]["tracks"]["Row"] & {
  artist: Database["public"]["Tables"]["profiles"]["Row"]
  total_earned?: number
  play_count?: number
  like_count?: number
}

type Stream = Database["public"]["Tables"]["streams"]["Row"] & {
  tracks: Database["public"]["Tables"]["tracks"]["Row"]
}

export default function DashboardPage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [likedTracks, setLikedTracks] = useState<Track[]>([])
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalEarnings: 0,
    trackCount: 0,
  })

  useEffect(() => {
    async function loadDashboard() {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        const { data: profileData } = await ensureProfile(address)
        setProfile(profileData)

        const { data: tracksData } = await supabase
          .from("tracks")
          .select(`
            *,
            artist:profiles!tracks_artist_id_fkey(*)
          `)
          .eq("artist_id", address.toLowerCase())
          .order("created_at", { ascending: false })

        // Get earnings and play counts for each track
        if (tracksData) {
          const tracksWithMetrics = await Promise.all(
            tracksData.map(async (track) => {
              const { data: streams } = await supabase
                .from("streams")
                .select("chunks_played, total_paid")
                .eq("track_id", track.id)

              const total_earned = streams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
              const play_count = streams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0

              return {
                ...track,
                total_earned,
                play_count,
              } as Track
            }),
          )

          setTracks(tracksWithMetrics)
        }

        const { data: streams } = await supabase
          .from("streams")
          .select("track_id, chunks_played, total_paid, tracks!inner(artist_id)")
          .eq("tracks.artist_id", address.toLowerCase())

        const totalPlays = (streams as Stream[])?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
        const totalEarnings = (streams as Stream[])?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        const trackCount = tracksData?.length || 0

        setStats({ totalPlays, totalEarnings, trackCount })

        try {
          const { data: likes, error } = await supabase
            .from("likes")
            .select(
              `
              track_id,
              tracks:tracks!inner(
                *,
                artist:profiles!tracks_artist_id_fkey(*)
              )
            `,
            )
            .eq("user_address", address.toLowerCase())
            .order("created_at", { ascending: false })

          // If table doesn't exist, just skip liked tracks section
          if (error && error.code === "PGRST205") {
            console.log("[v0] Likes table not found - skipping liked tracks")
            setLikedTracks([])
          } else if (likes) {
            const likedTracksData = likes.map((like: any) => like.tracks)
            setLikedTracks(likedTracksData)
          }
        } catch (error) {
          console.error("Failed to load liked tracks:", error)
          setLikedTracks([])
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [address])

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to access the dashboard"
            icon={<Music className="h-10 w-10 md:h-12 md:w-12 text-primary" />}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-10 skeleton rounded w-48" />
                <div className="h-5 skeleton rounded w-64" />
              </div>
              <div className="h-11 w-40 skeleton rounded" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <SkeletonStats />
              <SkeletonStats />
              <SkeletonStats />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-xl">
                  <div className="h-6 skeleton rounded w-32 mb-2" />
                  <div className="h-4 skeleton rounded w-full" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">{profile?.artist_name || "Welcome to your artist dashboard"}</p>
          </div>
          <Button size="lg" asChild>
            <Link href="/dashboard/upload">
              <Upload className="h-5 w-5 mr-2" />
              Upload Track
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card
            className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover-lift animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tracks</p>
                <p className="text-3xl font-bold">{stats.trackCount}</p>
              </div>
            </div>
          </Card>

          <Card
            className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover-lift animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Plays</p>
                <p className="text-3xl font-bold">{stats.totalPlays}</p>
              </div>
            </div>
          </Card>

          <Card
            className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover-lift animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/20 border border-chart-3/30">
                <DollarSign className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">{stats.totalEarnings.toFixed(2)} USDC</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/dashboard/analytics" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover-lift transition-all">
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">View detailed insights and performance metrics</p>
            </Card>
          </Link>

          <Link href="/dashboard/earnings" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover-lift transition-all">
              <h3 className="font-semibold mb-2">Earnings</h3>
              <p className="text-sm text-muted-foreground">Manage your earnings and withdraw funds</p>
            </Card>
          </Link>

          <Link href="/profile" className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover-lift transition-all">
              <h3 className="font-semibold mb-2">Profile</h3>
              <p className="text-sm text-muted-foreground">Update your artist profile and settings</p>
            </Card>
          </Link>
        </div>

        {/* Your Likes section */}
        {likedTracks.length > 0 && (
          <>
            <div className="mb-6 animate-slide-up flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              <h2 className="text-2xl font-bold">Your Likes</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-12">
              {likedTracks.map((track, i) => (
                <div key={track.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <TrackCard track={track as any} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Your Tracks */}
        <div className="mb-6 animate-slide-up">
          <h2 className="text-2xl font-bold">Your Tracks</h2>
        </div>

        {tracks && tracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className="animate-slide-up group relative"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <TrackCard track={track as any} />
                {!track.is_active && (
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Hidden</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    asChild
                    className="h-8 w-8 p-0 bg-black/80 backdrop-blur-sm hover:bg-black/90"
                  >
                    <Link href={`/dashboard/edit/${track.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-12 text-center animate-scale-in">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
            <p className="text-muted-foreground mb-6">Upload your first track to get started</p>
            <Button asChild>
              <Link href="/dashboard/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Track
              </Link>
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
