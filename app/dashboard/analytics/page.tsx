"use client"

import { Card } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/analytics-chart"
import { TrendingUp, Users, Music, DollarSign, ArrowUp, ArrowDown, Clock, Zap } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"

export default function AnalyticsPage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalEarnings: 0,
    uniqueListeners: 0,
    totalTracks: 0,
    avgEarningsPerPlay: 0,
    playsGrowth: 0,
    earningsGrowth: 0,
  })
  const [topTracks, setTopTracks] = useState<any[]>([])
  const [streams, setStreams] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    async function loadAnalytics() {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        const { data: tracks } = await supabase
          .from("tracks")
          .select("id, title, created_at")
          .eq("artist_id", address.toLowerCase())
          .order("created_at", { ascending: false })

        const { data: streamsData } = await supabase
          .from("streams")
          .select("track_id, chunks_played, total_paid, listener_address, started_at, tracks!inner(artist_id, title)")
          .eq("tracks.artist_id", address.toLowerCase())
          .order("started_at", { ascending: false })

        setStreams(streamsData || [])

        const totalPlays = streamsData?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
        const totalEarnings = streamsData?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        const uniqueListeners = new Set(streamsData?.map((s) => s.listener_address)).size
        const totalTracks = tracks?.length || 0
        const avgEarningsPerPlay = totalPlays > 0 ? totalEarnings / totalPlays : 0

        // Calculate growth (last 7 days vs previous 7 days)
        const now = new Date()
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const recentStreams = streamsData?.filter((s) => new Date(s.started_at) >= last7Days) || []
        const previousStreams =
          streamsData?.filter((s) => new Date(s.started_at) >= previous7Days && new Date(s.started_at) < last7Days) ||
          []

        const recentPlays = recentStreams.reduce((sum, s) => sum + s.chunks_played, 0)
        const previousPlays = previousStreams.reduce((sum, s) => sum + s.chunks_played, 0)
        const playsGrowth = previousPlays > 0 ? ((recentPlays - previousPlays) / previousPlays) * 100 : 0

        const recentEarnings = recentStreams.reduce((sum, s) => sum + Number(s.total_paid), 0)
        const previousEarnings = previousStreams.reduce((sum, s) => sum + Number(s.total_paid), 0)
        const earningsGrowth = previousEarnings > 0 ? ((recentEarnings - previousEarnings) / previousEarnings) * 100 : 0

        setStats({
          totalPlays,
          totalEarnings,
          uniqueListeners,
          totalTracks,
          avgEarningsPerPlay,
          playsGrowth,
          earningsGrowth,
        })

        const trackStats = tracks?.map((track) => {
          const trackStreams = streamsData?.filter((s) => s.track_id === track.id) || []
          const plays = trackStreams.reduce((sum, s) => sum + s.chunks_played, 0)
          const earnings = trackStreams.reduce((sum, s) => sum + Number(s.total_paid), 0)
          const listeners = new Set(trackStreams.map((s) => s.listener_address)).size
          return { ...track, plays, earnings, listeners }
        })

        const sortedTracks = trackStats?.sort((a, b) => b.plays - a.plays).slice(0, 5) || []
        setTopTracks(sortedTracks)

        const recentActivityData =
          streamsData?.slice(0, 10).map((stream) => ({
            ...stream,
            timeAgo: getTimeAgo(new Date(stream.started_at)),
          })) || []
        setRecentActivity(recentActivityData)
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [address])

  function getTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to view detailed analytics and performance metrics"
            icon={<TrendingUp className="h-10 w-10 md:h-12 md:w-12 text-primary" />}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">Loading analytics...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your performance and audience insights in real-time
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 group-hover:bg-primary/30 transition-colors">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Plays</p>
              </div>
              {stats.playsGrowth !== 0 && (
                <div
                  className={`flex items-center gap-1 text-xs ${stats.playsGrowth > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {stats.playsGrowth > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(stats.playsGrowth).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalPlays.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-accent/50 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/20 border border-accent/30 group-hover:bg-accent/30 transition-colors">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Listeners</p>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{stats.uniqueListeners.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-chart-3/50 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-chart-3/20 border border-chart-3/30 group-hover:bg-chart-3/30 transition-colors">
                  <Music className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Tracks</p>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalTracks}</p>
            <p className="text-xs text-muted-foreground mt-1">Published</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms] group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 group-hover:bg-primary/30 transition-colors">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Earnings</p>
              </div>
              {stats.earningsGrowth !== 0 && (
                <div
                  className={`flex items-center gap-1 text-xs ${stats.earningsGrowth > 0 ? "text-primary" : "text-red-500"}`}
                >
                  {stats.earningsGrowth > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(stats.earningsGrowth).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="bg-transparent py-1 sm:py-2">
              <p className="inline-block text-xl sm:text-2xl md:text-3xl font-bold text-primary animate-pulse-glow drop-shadow-[0_0_16px_hsl(35,75%,50%)]">
                {stats.totalEarnings.toFixed(4)}
              </p>
              <span className="text-sm sm:text-base text-primary ml-1">USDC</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">≈ ${(stats.totalEarnings * 1).toFixed(2)} USD</p>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-500">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg. Per Play</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-500">
                  {stats.avgEarningsPerPlay.toFixed(6)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Your average revenue per stream chunk</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-500">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{recentActivity.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Streams in the last 24 hours</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-700 delay-700">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Plays Over Time
            </h3>
            <AnalyticsChart data={streams || []} type="plays" />
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-700 delay-700">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Earnings Over Time
            </h3>
            <AnalyticsChart data={streams || []} type="earnings" />
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Top Performing Tracks
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {topTracks.length > 0 ? (
              topTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-primary/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white font-bold text-sm sm:text-base flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base truncate">{track.title}</h4>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {track.plays}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {track.listeners}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="inline-block font-semibold text-xs sm:text-sm text-primary animate-pulse-glow drop-shadow-[0_0_12px_hsl(35,75%,50%)]">
                      {track.earnings.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">USDC</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm sm:text-base text-muted-foreground py-8">No data available yet</p>
            )}
          </div>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[1200ms]">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-all duration-300 border border-transparent hover:border-primary/30"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{activity.tracks.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.listener_address.slice(0, 6)}...{activity.listener_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-medium text-primary">
                      +{Number(activity.total_paid).toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm sm:text-base text-muted-foreground py-8">No recent activity</p>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
