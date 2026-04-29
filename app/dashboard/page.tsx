"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Music,
  TrendingUp,
  DollarSign,
  Upload,
  Heart,
  Edit,
  EyeOff,
  BarChart3,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Coins,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { TrackCard } from "@/components/track-card"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { ensureProfile } from "@/lib/supabase/helpers"
import type { Database } from "@/types/database"
import { SkeletonCard, SkeletonStats } from "@/components/skeleton-loader"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import { TokenizeProfileModal } from "@/components/tokenize-profile-modal"

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
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [growthStats, setGrowthStats] = useState({
    playsGrowth: 0,
    earningsGrowth: 0,
    tracksGrowth: 0,
  })
  const [showTokenizeModal, setShowTokenizeModal] = useState(false)

  const loadDashboard = async () => {
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

      console.log("[v0] Dashboard streams query result:", {
        streamsCount: streams?.length || 0,
        streams: streams?.slice(0, 3), // Log first 3 for debugging
      })

      const totalPlays = (streams as Stream[])?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
      const totalEarnings = (streams as Stream[])?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
      const trackCount = tracksData?.length || 0

      console.log("[v0] Dashboard stats calculated:", { totalPlays, totalEarnings, trackCount })

      setStats({ totalPlays, totalEarnings, trackCount })

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentStreams } = await supabase
        .from("streams")
        .select("track_id, chunks_played, total_paid, started_at, tracks!inner(artist_id)")
        .eq("tracks.artist_id", address.toLowerCase())
        .gte("started_at", sevenDaysAgo.toISOString())

      const recentPlays = (recentStreams as Stream[])?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
      const recentEarnings = (recentStreams as Stream[])?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0

      const playsGrowth = totalPlays > 0 ? (recentPlays / totalPlays) * 100 : 0
      const earningsGrowth = totalEarnings > 0 ? (recentEarnings / totalEarnings) * 100 : 0

      setGrowthStats({
        playsGrowth: Math.round(playsGrowth),
        earningsGrowth: Math.round(earningsGrowth),
        tracksGrowth: 0,
      })

      const { data: recentActivityData } = await supabase
        .from("streams")
        .select(`
          *,
          tracks!inner(
            title,
            artist_id,
            tracks.artist_id
          )
        `)
        .eq("tracks.artist_id", address.toLowerCase())
        .order("last_played_at", { ascending: false })
        .limit(5)

      setRecentActivity(recentActivityData || [])

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

  useEffect(() => {
    loadDashboard()
  }, [address])

  const handleTokenizeSuccess = (tokenAddress: string) => {
    console.log("[v0] Profile tokenized:", tokenAddress)
    // Reload dashboard to show new token address
    loadDashboard()
  }

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
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm text-white/40 mb-2">Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {profile?.artist_name || "Welcome Back"}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button size="sm" asChild>
                <Link href="/dashboard/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/analytics">
                  Analytics
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <Music className="h-4 w-4 text-[#FF2A2A]" />
              </div>
              {growthStats.tracksGrowth !== 0 && (
                <span className={`text-xs ${growthStats.tracksGrowth > 0 ? "text-green-500" : "text-red-500"}`}>
                  {growthStats.tracksGrowth > 0 ? "+" : ""}{growthStats.tracksGrowth}%
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mb-1">Tracks</p>
            <p className="text-2xl font-bold">{stats.trackCount}</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#FF2A2A]" />
              </div>
              {growthStats.playsGrowth > 0 && (
                <span className="text-xs text-green-500">+{growthStats.playsGrowth}%</span>
              )}
            </div>
            <p className="text-xs text-white/40 mb-1">Plays</p>
            <p className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[#FF2A2A]" />
              </div>
              {growthStats.earningsGrowth > 0 && (
                <span className="text-xs text-green-500">+{growthStats.earningsGrowth}%</span>
              )}
            </div>
            <p className="text-xs text-white/40 mb-1">Earnings</p>
            <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
          </Card>

          {profile?.profile_token_address ? (
            <Card
              className="bg-gradient-to-br from-chart-4/20 to-chart-4/10 backdrop-blur-xl border border-chart-4/30 shadow-lg p-6 hover-lift transition-all h-full animate-slide-up group"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/30 border border-chart-4/40 group-hover:scale-110 transition-transform">
                  <Coins className="h-5 w-5 text-chart-4" />
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Profile Token</h3>
              <p className="text-sm text-muted-foreground mb-3">Your profile is tokenized</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-chart-4/20 hover:bg-chart-4/10 bg-transparent"
                onClick={() => {
                  navigator.clipboard.writeText(profile.profile_token_address)
                  // TODO: Add toast notification
                }}
              >
                Copy Address
              </Button>
            </Card>
          ) : (
            <button
              onClick={() => setShowTokenizeModal(true)}
              className="animate-slide-up group text-left"
              style={{ animationDelay: "0.5s" }}
            >
              <Card className="bg-gradient-to-br from-chart-4/20 to-chart-4/10 backdrop-blur-xl border border-chart-4/30 shadow-lg p-6 hover-lift transition-all h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/30 border border-chart-4/40 group-hover:scale-110 transition-transform">
                    <Coins className="h-5 w-5 text-chart-4" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-chart-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <h3 className="font-semibold mb-2">Tokenize Profile</h3>
                <p className="text-sm text-muted-foreground">Create your own profile token on Base</p>
              </Card>
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard/analytics" className="animate-slide-up group" style={{ animationDelay: "0.1s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg p-6 hover-lift transition-all h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">View detailed insights and performance metrics</p>
            </Card>
          </Link>

          <Link href="/dashboard/earnings" className="animate-slide-up group" style={{ animationDelay: "0.2s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg p-6 hover-lift transition-all h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20 border border-chart-3/30 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5 text-chart-3" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-chart-3 transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Earnings</h3>
              <p className="text-sm text-muted-foreground">Track your revenue and payment history</p>
            </Card>
          </Link>

          <Link href="/profile" className="animate-slide-up group" style={{ animationDelay: "0.3s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg p-6 hover-lift transition-all h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 border border-accent/30 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Profile</h3>
              <p className="text-sm text-muted-foreground">Update your artist profile and settings</p>
            </Card>
          </Link>

          <Link href="/dashboard/upload" className="animate-slide-up group" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/10 backdrop-blur-xl border border-primary/30 shadow-lg p-6 hover-lift transition-all h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/30 border border-primary/40 group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="font-semibold mb-2">Upload Track</h3>
              <p className="text-sm text-muted-foreground">Share your latest music with the world</p>
            </Card>
          </Link>
        </div>

        {recentActivity.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6 animate-slide-up">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Recent Activity</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/analytics">View All</Link>
              </Button>
            </div>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg p-6 animate-slide-up">
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.tracks?.title || "Unknown Track"}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.chunks_played} plays • ${Number(activity.total_paid).toFixed(2)} earned
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.last_played_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

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
                <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
      <TokenizeProfileModal
        open={showTokenizeModal}
        onOpenChange={setShowTokenizeModal}
        onSuccess={handleTokenizeSuccess}
        artistName={profile?.artist_name || undefined}
      />
    </div>
  )
}
