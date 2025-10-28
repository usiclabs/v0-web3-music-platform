"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  Users,
  Music,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Wallet,
  Search,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Eye,
  Play,
  Heart,
  Calendar,
  BarChart3,
} from "lucide-react"
import { useAccount } from "wagmi"
import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Admin wallet address - only this address can access the admin panel
const ADMIN_ADDRESS = "0x7D1a4B4941200FB2907638202782E9248b9b9887"

type PlatformStats = {
  totalUsers: number
  totalTracks: number
  totalStreams: number
  totalRevenue: number
  activeUsers24h: number
  newUsers7d: number
  totalLikes: number
  totalFollows: number
  avgRevenuePerUser: number
  revenueGrowth: number
  userGrowth: number
}

type RecentActivity = {
  id: string
  type: "track" | "user" | "stream" | "payout"
  description: string
  timestamp: string
  amount?: number
}

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalTracks: 0,
    totalStreams: 0,
    totalRevenue: 0,
    activeUsers24h: 0,
    newUsers7d: 0,
    totalLikes: 0,
    totalFollows: 0,
    avgRevenuePerUser: 0,
    revenueGrowth: 0,
    userGrowth: 0,
  })

  const [users, setUsers] = useState<any[]>([])
  const [tracks, setTracks] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [payoutHistory, setPayoutHistory] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"plays" | "revenue" | "date">("plays")
  const [cdpStatus, setCdpStatus] = useState<{ configured: boolean; message: string } | null>(null)
  const [processingPayout, setProcessingPayout] = useState(false)
  const [payoutResult, setPayoutResult] = useState<any>(null)

  // Check if connected wallet is admin (case-insensitive)
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  useEffect(() => {
    async function loadAdminData() {
      if (!isAdmin) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        // Get platform statistics
        const [
          { count: totalUsers },
          { count: totalTracks },
          { count: totalLikes },
          { count: totalFollows },
          { data: streams },
          { data: profiles },
          { data: tracksData },
          { data: recentStreams },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("tracks").select("*", { count: "exact", head: true }),
          supabase.from("likes").select("*", { count: "exact", head: true }),
          supabase.from("follows").select("*", { count: "exact", head: true }),
          supabase.from("streams").select("chunks_played, total_paid, created_at, listener_address"),
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase
            .from("tracks")
            .select("*, artist:profiles!tracks_artist_id_fkey(artist_name, wallet_address)")
            .order("created_at", { ascending: false }),
          supabase
            .from("streams")
            .select("*, track:tracks(title), listener:profiles!streams_listener_address_fkey(artist_name)")
            .order("last_played_at", { ascending: false })
            .limit(20),
        ])

        const totalStreams = streams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
        const totalRevenue = streams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0

        // Calculate active users in last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

        const { count: activeUsers24h } = await supabase
          .from("streams")
          .select("listener_address", { count: "exact", head: true })
          .gte("created_at", oneDayAgo)

        const { count: newUsers7d } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo)

        const { count: newUsersPrevious7d } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", fourteenDaysAgo)
          .lt("created_at", sevenDaysAgo)

        const recentRevenue =
          streams
            ?.filter((s) => new Date(s.created_at) >= new Date(sevenDaysAgo))
            .reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        const previousRevenue =
          streams
            ?.filter(
              (s) =>
                new Date(s.created_at) >= new Date(fourteenDaysAgo) && new Date(s.created_at) < new Date(sevenDaysAgo),
            )
            .reduce((sum, s) => sum + Number(s.total_paid), 0) || 0

        const userGrowth = newUsersPrevious7d ? ((newUsers7d - newUsersPrevious7d) / newUsersPrevious7d) * 100 : 0
        const revenueGrowth = previousRevenue ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0

        setStats({
          totalUsers: totalUsers || 0,
          totalTracks: totalTracks || 0,
          totalStreams,
          totalRevenue,
          activeUsers24h: activeUsers24h || 0,
          newUsers7d: newUsers7d || 0,
          totalLikes: totalLikes || 0,
          totalFollows: totalFollows || 0,
          avgRevenuePerUser: totalUsers ? totalRevenue / totalUsers : 0,
          revenueGrowth,
          userGrowth,
        })

        const usersWithStats = await Promise.all(
          profiles?.map(async (profile) => {
            const { count: trackCount } = await supabase
              .from("tracks")
              .select("*", { count: "exact", head: true })
              .eq("artist_id", profile.wallet_address)

            const { data: userStreams } = await supabase
              .from("streams")
              .select("total_paid")
              .eq("listener_address", profile.wallet_address)

            const totalSpent = userStreams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0

            return {
              ...profile,
              trackCount: trackCount || 0,
              totalSpent,
            }
          }) || [],
        )

        setUsers(usersWithStats)

        const tracksWithStats = await Promise.all(
          tracksData?.map(async (track) => {
            const { data: trackStreams } = await supabase
              .from("streams")
              .select("chunks_played, total_paid")
              .eq("track_id", track.id)

            const plays = trackStreams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
            const revenue = trackStreams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0

            const { count: likes } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("track_id", track.id)

            return {
              ...track,
              plays,
              revenue,
              likes: likes || 0,
            }
          }) || [],
        )

        setTracks(tracksWithStats)

        const activity: RecentActivity[] =
          recentStreams?.map((stream) => ({
            id: stream.id,
            type: "stream" as const,
            description: `${stream.listener?.artist_name || "Anonymous"} played "${stream.track?.title || "Unknown"}"`,
            timestamp: stream.last_played_at,
            amount: Number(stream.total_paid),
          })) || []

        setRecentActivity(activity)

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const dailyData = new Map<string, { date: string; revenue: number; users: number; streams: number }>()

        for (let i = 0; i < 30; i++) {
          const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split("T")[0]
          dailyData.set(dateStr, { date: dateStr, revenue: 0, users: 0, streams: 0 })
        }

        streams?.forEach((stream) => {
          const dateStr = new Date(stream.created_at).toISOString().split("T")[0]
          const data = dailyData.get(dateStr)
          if (data) {
            data.revenue += Number(stream.total_paid)
            data.streams += stream.chunks_played
          }
        })

        profiles?.forEach((profile) => {
          const dateStr = new Date(profile.created_at).toISOString().split("T")[0]
          const data = dailyData.get(dateStr)
          if (data) {
            data.users += 1
          }
        })

        setChartData(Array.from(dailyData.values()))

        const cdpResponse = await fetch("/api/admin/payouts")
        const cdpData = await cdpResponse.json()
        setCdpStatus(cdpData)
      } catch (error) {
        console.error("Failed to load admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [isAdmin])

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    window.location.reload()
  }

  const handleTriggerPayouts = async () => {
    setProcessingPayout(true)
    setPayoutResult(null)

    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
      })

      const data = await response.json()
      setPayoutResult(data)
    } catch (error) {
      setPayoutResult({
        success: false,
        error: "Failed to trigger payouts",
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setProcessingPayout(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.wallet_address?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [users, searchQuery])

  const filteredTracks = useMemo(() => {
    const filtered = tracks.filter(
      (track) =>
        track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist?.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return filtered.sort((a, b) => {
      if (sortBy === "plays") return b.plays - a.plays
      if (sortBy === "revenue") return b.revenue - a.revenue
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [tracks, searchQuery, sortBy])

  // Access denied screen
  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5 flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-12 max-w-md text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 border-2 border-destructive/30 mx-auto mb-6 animate-pulse">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-muted-foreground bg-clip-text text-transparent">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {!isConnected
              ? "Please connect your wallet to access the admin panel."
              : "You do not have permission to access this page. This area is restricted to authorized administrators only."}
          </p>
          {isConnected && (
            <div className="text-xs text-muted-foreground font-mono bg-muted/20 p-4 rounded-lg border border-border/50">
              <p className="text-xs uppercase tracking-wider mb-2 text-muted-foreground/70">Connected Wallet</p>
              <p className="font-semibold">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          )}
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5">
        <main className="container py-12 px-4 sm:px-6">
          <div className="space-y-8 animate-pulse">
            <div className="h-12 bg-muted/20 rounded-lg w-64" />
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-32 bg-muted/20 rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-muted/20 rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5">
      <main className="container py-12 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Platform management and analytics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:border-primary/50 transition-all bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-4 py-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              {stats.userGrowth !== 0 && (
                <Badge
                  variant="outline"
                  className={`${stats.userGrowth > 0 ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500"}`}
                >
                  {stats.userGrowth > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(stats.userGrowth).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-3xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">+{stats.newUsers7d} this week</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <Music className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Tracks</p>
            <p className="text-3xl font-bold mb-1">{stats.totalTracks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-green-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Streams</p>
            <p className="text-3xl font-bold mb-1">{stats.totalStreams.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms] group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              {stats.revenueGrowth !== 0 && (
                <Badge
                  variant="outline"
                  className={`${stats.revenueGrowth > 0 ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500"}`}
                >
                  {stats.revenueGrowth > 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stats.revenueGrowth).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-primary mb-1 animate-pulse-glow drop-shadow-[0_0_16px_hsl(35,75%,50%)]">
              ${stats.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">USDC</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Active Users</p>
            <p className="text-3xl font-bold mb-1">{stats.activeUsers24h.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-pink-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[600ms] group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/30 group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Likes</p>
            <p className="text-3xl font-bold mb-1">{stats.totalLikes.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Follows</p>
            <p className="text-3xl font-bold mb-1">{stats.totalFollows.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Connections</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[800ms] group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6 text-green-500" />
              </div>
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">System Status</p>
            <p className="text-3xl font-bold mb-1">100%</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue Trend (30 Days)
              </h3>
              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.revenueGrowth > 0 ? "+" : ""}
                {stats.revenueGrowth.toFixed(1)}%
              </Badge>
            </div>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-blue-500/50 transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                User Growth (30 Days)
              </h3>
              <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.userGrowth > 0 ? "+" : ""}
                {stats.userGrowth.toFixed(1)}%
              </Badge>
            </div>
            <ChartContainer
              config={{
                users: {
                  label: "New Users",
                  color: "hsl(217, 91%, 60%)",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="hsl(217, 91%, 60%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-xl border border-border/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="tracks" className="data-[state=active]:bg-primary/20">
              <Music className="h-4 w-4 mr-2" />
              Tracks
            </TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-primary/20">
              <Wallet className="h-4 w-4 mr-2" />
              Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 10).map((activity, i) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-all duration-300 border border-transparent hover:border-primary/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex-shrink-0">
                          <Play className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-primary/10 border-primary/30 text-primary flex-shrink-0 ml-2"
                      >
                        +${activity.amount?.toFixed(4)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-background/50 border-border/50"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="border-border/50 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/30">
                      <TableHead>User</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead className="text-right">Tracks</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 20).map((user) => (
                      <TableRow key={user.wallet_address} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <span>{user.artist_name || "Anonymous"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                        </TableCell>
                        <TableCell className="text-right">{user.trackCount}</TableCell>
                        <TableCell className="text-right text-primary font-semibold">
                          ${user.totalSpent.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tracks" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  Track Management
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tracks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border/50 rounded-lg p-1 bg-background/50">
                    <Button
                      variant={sortBy === "plays" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("plays")}
                      className="h-8"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Plays
                    </Button>
                    <Button
                      variant={sortBy === "revenue" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("revenue")}
                      className="h-8"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Revenue
                    </Button>
                    <Button
                      variant={sortBy === "date" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("date")}
                      className="h-8"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Date
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/30">
                      <TableHead>Track</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead className="text-right">Plays</TableHead>
                      <TableHead className="text-right">Likes</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTracks.slice(0, 20).map((track) => (
                      <TableRow key={track.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-border/50 flex items-center justify-center flex-shrink-0">
                              <Music className="h-5 w-5 text-purple-500" />
                            </div>
                            <span className="truncate max-w-xs">{track.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{track.artist?.artist_name || "Unknown"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                            <Play className="h-3 w-3 mr-1" />
                            {track.plays.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-500">
                            <Heart className="h-3 w-3 mr-1" />
                            {track.likes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-primary font-semibold">
                          ${track.revenue.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(track.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    CDP Payout Management
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Trigger batch payouts to all artists with pending earnings using CDP SDK
                  </p>
                </div>
                {cdpStatus && (
                  <Badge
                    variant="outline"
                    className={
                      cdpStatus.configured
                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                        : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                    }
                  >
                    {cdpStatus.configured ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        CDP Configured
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        CDP Not Configured
                      </>
                    )}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Ready to Process</p>
                  <p className="text-2xl font-bold">Automated Batch Payouts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Process all pending artist earnings in one transaction
                  </p>
                </div>
                <Button
                  onClick={handleTriggerPayouts}
                  disabled={processingPayout || !cdpStatus?.configured}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {processingPayout ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Trigger Payouts
                    </>
                  )}
                </Button>
              </div>

              {payoutResult && (
                <div
                  className={`p-6 rounded-lg border animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                    payoutResult.success
                      ? "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30"
                      : "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        payoutResult.success
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-red-500/20 border border-red-500/30"
                      }`}
                    >
                      {payoutResult.success ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg mb-2">
                        {payoutResult.success ? "Payouts Processed Successfully" : "Payout Failed"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">{payoutResult.message || payoutResult.error}</p>
                      {payoutResult.success && (
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="bg-background/50 border-border/50 p-4">
                            <p className="text-xs text-muted-foreground mb-1">Successful</p>
                            <p className="text-2xl font-bold text-green-500">{payoutResult.success}</p>
                          </Card>
                          <Card className="bg-background/50 border-border/50 p-4">
                            <p className="text-xs text-muted-foreground mb-1">Failed</p>
                            <p className="text-2xl font-bold text-red-500">{payoutResult.failed}</p>
                          </Card>
                          <Card className="bg-background/50 border-border/50 p-4">
                            <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-primary">${payoutResult.totalAmount}</p>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
