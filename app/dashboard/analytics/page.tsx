"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnalyticsChart } from "@/components/analytics-chart"
import {
  TrendingUp,
  Users,
  Music,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  Download,
  Calendar,
  Activity,
  Eye,
  Headphones,
} from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type DateRange = "7d" | "30d" | "90d" | "all"

export default function AnalyticsPage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalEarnings: 0,
    uniqueListeners: 0,
    totalTracks: 0,
    avgEarningsPerPlay: 0,
    playsGrowth: 0,
    earningsGrowth: 0,
    avgSessionDuration: 0,
    engagementRate: 0,
    returningListeners: 0,
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

        const now = new Date()
        let startDate = new Date()
        if (dateRange === "7d") startDate.setDate(now.getDate() - 7)
        else if (dateRange === "30d") startDate.setDate(now.getDate() - 30)
        else if (dateRange === "90d") startDate.setDate(now.getDate() - 90)
        else startDate = new Date(0) // All time

        const { data: tracks } = await supabase
          .from("tracks")
          .select("id, title, created_at")
          .eq("artist_id", address.toLowerCase())
          .order("created_at", { ascending: false })

        let streamsQuery = supabase
          .from("streams")
          .select("track_id, chunks_played, total_paid, listener_address, started_at, tracks!inner(artist_id, title)")
          .eq("tracks.artist_id", address.toLowerCase())
          .order("started_at", { ascending: false })

        if (dateRange !== "all") {
          streamsQuery = streamsQuery.gte("started_at", startDate.toISOString())
        }

        const { data: streamsData } = await streamsQuery

        setStreams(streamsData || [])

        const totalPlays = streamsData?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
        const totalEarnings = streamsData?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        const uniqueListeners = new Set(streamsData?.map((s) => s.listener_address)).size
        const totalTracks = tracks?.length || 0
        const avgEarningsPerPlay = totalPlays > 0 ? totalEarnings / totalPlays : 0

        const listenerSessions = streamsData?.reduce(
          (acc, s) => {
            if (!acc[s.listener_address]) acc[s.listener_address] = []
            acc[s.listener_address].push(s)
            return acc
          },
          {} as Record<string, any[]>,
        )
        const returningListeners = Object.values(listenerSessions || {}).filter(
          (sessions) => sessions.length > 1,
        ).length
        const engagementRate = uniqueListeners > 0 ? (returningListeners / uniqueListeners) * 100 : 0
        const avgSessionDuration = totalPlays > 0 ? totalPlays / (streamsData?.length || 1) : 0

        // Calculate growth (compare to previous period)
        const periodDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365
        const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

        const { data: previousStreams } = await supabase
          .from("streams")
          .select("chunks_played, total_paid, tracks!inner(artist_id)")
          .eq("tracks.artist_id", address.toLowerCase())
          .gte("started_at", previousPeriodStart.toISOString())
          .lt("started_at", startDate.toISOString())

        const previousPlays = previousStreams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
        const previousEarnings = previousStreams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        const playsGrowth = previousPlays > 0 ? ((totalPlays - previousPlays) / previousPlays) * 100 : 0
        const earningsGrowth = previousEarnings > 0 ? ((totalEarnings - previousEarnings) / previousEarnings) * 100 : 0

        setStats({
          totalPlays,
          totalEarnings,
          uniqueListeners,
          totalTracks,
          avgEarningsPerPlay,
          playsGrowth,
          earningsGrowth,
          avgSessionDuration,
          engagementRate,
          returningListeners,
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
  }, [address, dateRange])

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

  function exportData() {
    const csv = [
      ["Date", "Track", "Plays", "Earnings", "Listener"],
      ...streams.map((s) => [
        new Date(s.started_at).toLocaleDateString(),
        s.tracks.title,
        s.chunks_played,
        s.total_paid,
        s.listener_address,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32 bg-gradient-to-b from-black via-black to-primary/5">
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
      <div className="min-h-screen pb-32 bg-gradient-to-b from-black via-black to-primary/5">
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
    <div className="min-h-screen pb-32 bg-gradient-to-b from-black via-black to-primary/5">
      <main className="container px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                Track your performance and audience insights in real-time
              </p>
            </div>
            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300 bg-transparent"
              disabled={streams.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 bg-card/50 backdrop-blur-xl border border-border/50">
              <TabsTrigger value="7d" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Calendar className="h-3 w-3 mr-1" />
                7D
              </TabsTrigger>
              <TabsTrigger value="30d" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Calendar className="h-3 w-3 mr-1" />
                30D
              </TabsTrigger>
              <TabsTrigger value="90d" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Calendar className="h-3 w-3 mr-1" />
                90D
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Calendar className="h-3 w-3 mr-1" />
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/30 p-4 sm:p-6 hover:border-primary hover:shadow-[0_0_30px_rgba(255,165,0,0.15)] transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/20 border border-primary/40 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                {stats.playsGrowth !== 0 && (
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      stats.playsGrowth > 0
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {stats.playsGrowth > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(stats.playsGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Plays</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
                {stats.totalPlays.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {dateRange === "7d"
                  ? "Last 7 days"
                  : dateRange === "30d"
                    ? "Last 30 days"
                    : dateRange === "90d"
                      ? "Last 90 days"
                      : "All time"}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-accent/30 p-4 sm:p-6 hover:border-accent hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 group-hover:bg-accent/30 group-hover:scale-110 transition-all duration-300">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unique Listeners</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                {stats.uniqueListeners.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{stats.returningListeners} returning</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-chart-3/30 p-4 sm:p-6 hover:border-chart-3 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-chart-3/20 border border-chart-3/40 group-hover:bg-chart-3/30 group-hover:scale-110 transition-all duration-300">
                  <Music className="h-5 w-5 sm:h-6 sm:w-6 text-chart-3" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Published Tracks</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-chart-3 bg-clip-text text-transparent">
                {stats.totalTracks}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Active catalog</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/30 p-4 sm:p-6 hover:border-primary hover:shadow-[0_0_30px_rgba(255,165,0,0.2)] transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms] group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/20 border border-primary/40 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                {stats.earningsGrowth !== 0 && (
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      stats.earningsGrowth > 0
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {stats.earningsGrowth > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(stats.earningsGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Earnings</p>
              <div className="py-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary drop-shadow-[0_0_20px_rgba(255,165,0,0.5)]">
                  {stats.totalEarnings.toFixed(4)}
                </span>
                <span className="text-sm sm:text-base text-primary/80 ml-1">USDC</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">≈ ${(stats.totalEarnings * 1).toFixed(2)} USD</p>
            </div>
          </Card>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-500 delay-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Avg. Per Play</p>
                <p className="text-xl font-bold text-purple-500">{stats.avgEarningsPerPlay.toFixed(6)} USDC</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Revenue per stream chunk</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
                <p className="text-xl font-bold text-blue-500">{stats.engagementRate.toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Returning listener ratio</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-500 delay-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Avg. Session</p>
                <p className="text-xl font-bold text-primary">{stats.avgSessionDuration.toFixed(1)} chunks</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Average listening duration</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,165,0,0.1)] transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-700 delay-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Plays Over Time
              </h3>
            </div>
            <AnalyticsChart data={streams || []} type="plays" />
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,165,0,0.1)] transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-700 delay-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                Earnings Over Time
              </h3>
            </div>
            <AnalyticsChart data={streams || []} type="earnings" />
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-8 sm:mb-12 hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Music className="h-4 w-4 text-primary" />
              </div>
              Top Performing Tracks
            </h3>
          </div>
          <div className="space-y-3">
            {topTracks.length > 0 ? (
              topTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/20 to-transparent hover:from-muted/30 hover:to-muted/10 transition-all duration-300 hover:scale-[1.01] border border-transparent hover:border-primary/20 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-accent to-chart-3 text-white font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{track.plays.toLocaleString()}</span> plays
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-accent" />
                          <span className="font-medium">{track.listeners}</span> listeners
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-lg text-primary drop-shadow-[0_0_12px_rgba(255,165,0,0.5)]">
                      {track.earnings.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">USDC</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 mx-auto mb-4">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base text-muted-foreground mb-2">No tracks yet</p>
                <p className="text-sm text-muted-foreground/70">Upload your first track to see analytics</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[1200ms]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Recent Activity
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live
            </div>
          </div>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/10 to-transparent hover:from-muted/20 hover:to-muted/10 transition-all duration-300 border border-transparent hover:border-primary/20 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(255,165,0,0.5)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {activity.tracks.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {activity.listener_address.slice(0, 6)}...{activity.listener_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-primary">+{Number(activity.total_paid).toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 mx-auto mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base text-muted-foreground mb-2">No recent activity</p>
                <p className="text-sm text-muted-foreground/70">
                  Activity will appear here as listeners stream your tracks
                </p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
