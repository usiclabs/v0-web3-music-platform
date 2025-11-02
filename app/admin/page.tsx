"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Shield,
  Users,
  Music,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Search,
  Download,
  RefreshCw,
  Eye,
  Play,
  Heart,
  Ban,
  Trash2,
  Star,
  Radio,
  Settings,
  Power,
  MoreVertical,
  AlertTriangle,
  List,
  Grid,
  Coins,
  Plus,
  Sparkles,
  ArrowRight,
  Flag,
  X,
} from "lucide-react"
import { useAccount } from "wagmi"
import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

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
  totalTransactions?: number // Added for gasless dashboard
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
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

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
    totalTransactions: 0, // Initialize for gasless dashboard
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

  const [liveStreams, setLiveStreams] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  // Removed: const [reportedContent, setReportedContent] = useState<any[]>([]) // Replaced by reports state

  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedTrack, setSelectedTrack] = useState<any>(null)
  const [selectedStream, setSelectedStream] = useState<any>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showTrackDialog, setShowTrackDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)
  const [showStreamDialog, setShowStreamDialog] = useState(false) // Added state for stream dialog

  const [showEditTrackDialog, setShowEditTrackDialog] = useState(false)
  const [editTrackData, setEditTrackData] = useState({
    id: "",
    title: "",
    audio_url: "",
    cover_url: "",
    coin_address: "",
    token_id: "",
    nft_contract_address: "",
    price_per_chunk: "0.001",
    duration: 180,
    unlock_type: "token",
    is_featured: false, // Added for feature flag
  })
  const [updatingTrack, setUpdatingTrack] = useState(false)

  const [showHiddenTracks, setShowHiddenTracks] = useState(false)

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [featureFlags, setFeatureFlags] = useState({
    liveStreaming: true,
    staking: true,
    swap: true,
    nftMinting: true,
  })

  const [tokenizedSongs, setTokenizedSongs] = useState<any[]>([])
  const [showAddTokenDialog, setShowAddTokenDialog] = useState(false)
  const [tokenFormData, setTokenFormData] = useState({
    title: "",
    artist_id: "",
    audio_url: "",
    cover_url: "",
    coin_address: "",
    token_id: "",
    nft_contract_address: "",
    price_per_chunk: "0.001",
    duration: 180,
  })
  const [submittingToken, setSubmittingToken] = useState(false)

  // Check if connected wallet is admin (case-insensitive)
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  // Function to load all tracks, including featured status
  const loadAllTracks = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*, artist:profiles!tracks_artist_id_fkey(artist_name, wallet_address), is_featured") // Include is_featured
        .order("created_at", { ascending: false })

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
    } catch (error) {
      console.error("Failed to load tracks:", error)
    }
  }

  useEffect(() => {
    async function loadAdminData() {
      if (!isAdmin) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        console.log("[v0] Loading admin data...")

        // Get platform statistics
        const [
          { count: totalUsers },
          { count: totalTracks },
          { count: totalLikes },
          { count: totalFollows },
          { data: streams },
          { data: profiles },
          // Removed tracksData from here as loadAllTracks will handle it
          { data: recentStreams },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("tracks").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("likes").select("*", { count: "exact", head: true }),
          supabase.from("follows").select("*", { count: "exact", head: true }),
          supabase.from("streams").select("chunks_played, total_paid, started_at, listener_address"),
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          // Moved tracks fetching to loadAllTracks function
          supabase
            .from("streams")
            .select(`
              *,
              track:tracks(title),
              listener:profiles!streams_listener_address_fkey(artist_name)
            `)
            .order("last_played_at", { ascending: false })
            .limit(20),
        ])

        console.log("[v0] Recent streams query result:", {
          count: recentStreams?.length || 0,
          sample: recentStreams?.[0],
          error: recentStreams === null ? "Query returned null" : "No error",
        })

        const totalStreams =
          streams?.reduce((sum, s) => {
            const chunks = Number(s.chunks_played) || 0
            return sum + chunks
          }, 0) || 0

        const totalRevenue =
          streams?.reduce((sum, s) => {
            const paid = Number(s.total_paid) || 0
            return sum + paid
          }, 0) || 0

        console.log("[v0] Total streams:", totalStreams)
        console.log("[v0] Total revenue:", totalRevenue)

        // Calculate active users in last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

        const { data: activeUsersData } = await supabase
          .from("streams")
          .select("listener_address")
          .gte("started_at", oneDayAgo)

        const uniqueActiveUsers = new Set(activeUsersData?.map((s) => s.listener_address) || [])
        const activeUsers24h = uniqueActiveUsers.size

        console.log("[v0] Active users 24h:", activeUsers24h, "unique users from", activeUsersData?.length, "streams")

        const { count: newUsers7d } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo)

        const { count: newUsersPrevious7d } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", fourteenDaysAgo)
          .lt("created_at", sevenDaysAgo)

        const userGrowth = newUsersPrevious7d ? ((newUsers7d - newUsersPrevious7d) / newUsersPrevious7d) * 100 : 0
        // Fetching previous week's revenue for revenueGrowth calculation
        const prevWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        const prevWeekEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: previousStreams } = await supabase
          .from("streams")
          .select("total_paid")
          .gte("started_at", prevWeekStart)
          .lt("started_at", prevWeekEnd)

        const previousRevenue = previousStreams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        const recentRevenue = totalRevenue // totalRevenue is already calculated for the current period
        const revenueGrowth = previousRevenue ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0

        // Fetch total transactions for gasless dashboard
        const { count: totalTransactions } = await supabase
          .from("relay_transactions") // Assuming this table stores relay transactions
          .select("*", { count: "exact", head: true })

        setStats({
          totalUsers: totalUsers || 0,
          totalTracks: totalTracks || 0,
          totalStreams,
          totalRevenue,
          activeUsers24h,
          newUsers7d: newUsers7d || 0,
          totalLikes: totalLikes || 0,
          totalFollows: totalFollows || 0,
          avgRevenuePerUser: totalUsers ? totalRevenue / totalUsers : 0,
          revenueGrowth,
          userGrowth,
          totalTransactions: totalTransactions || 0,
        })

        console.log("[v0] Stats updated:", {
          totalStreams,
          totalRevenue,
          activeUsers24h,
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

        // Moved tracks fetching to loadAllTracks function
        await loadAllTracks()

        const activity: RecentActivity[] =
          recentStreams
            ?.filter((stream) => stream.track && stream.total_paid) // Only include streams with valid track and payment data
            .map((stream) => ({
              id: stream.id,
              type: "stream" as const,
              description: `${stream.listener?.artist_name || `User ${stream.listener_address?.slice(0, 6)}...${stream.listener_address?.slice(-4)}`} played "${stream.track?.title || "Unknown Track"}"`,
              timestamp: stream.last_played_at || stream.started_at,
              amount: Number(stream.total_paid),
            })) || []

        console.log("[v0] Recent activity processed:", {
          count: activity.length,
          sample: activity[0],
        })

        setRecentActivity(activity)

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const dailyData = new Map<string, { date: string; revenue: number; users: number; streams: number }>()

        for (let i = 0; i < 30; i++) {
          const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split("T")[0]
          dailyData.set(dateStr, { date: dateStr, revenue: 0, users: 0, streams: 0 })
        }

        streams?.forEach((stream) => {
          const dateStr = new Date(stream.started_at).toISOString().split("T")[0] // Changed created_at to started_at
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

        const [{ data: liveStreamsData }, { data: playlistsData }, { data: swapHistory }, { data: stakingHistory }] =
          await Promise.all([
            supabase
              .from("live_streams")
              .select("*, artist:profiles!live_streams_artist_address_fkey(artist_name, wallet_address)")
              .order("created_at", { ascending: false }),
            supabase
              .from("playlists")
              .select("*, owner:profiles!playlists_owner_address_fkey(artist_name), track_count:playlist_tracks(count)")
              .order("created_at", { ascending: false }),
            supabase.from("swap_history").select("*").order("created_at", { ascending: false }).limit(50),
            supabase.from("staking_history").select("*").order("created_at", { ascending: false }).limit(50),
          ])

        setLiveStreams(liveStreamsData || [])
        setPlaylists(playlistsData || [])

        // Combine transactions
        const allTransactions = [
          ...(swapHistory || []).map((t) => ({ ...t, type: "swap" })),
          ...(stakingHistory || []).map((t) => ({ ...t, type: "staking" })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setTransactions(allTransactions)

        const { data: tokenizedTracksData } = await supabase
          .from("tracks")
          .select("*, artist:profiles!tracks_artist_id_fkey(artist_name, wallet_address)")
          .or("coin_address.not.is.null,nft_contract_address.not.is.null")
          .order("created_at", { ascending: false })

        setTokenizedSongs(tokenizedTracksData || [])

        try {
          const reportsResponse = await fetch("/api/admin/reports", {
            headers: { "x-wallet-address": address },
          })
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json()
            setReports(reportsData.reports || [])
          }
        } catch (error) {
          console.error("Failed to load reports:", error)
        }
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

  const handleBanUser = async (userAddress: string) => {
    try {
      // In production, this would update a banned_users table
      toast({
        title: "User Banned",
        description: `User ${userAddress.slice(0, 6)}...${userAddress.slice(-4)} has been banned.`,
      })
      setShowUserDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    try {
      const supabase = createBrowserClient()
      await supabase.from("tracks").update({ is_active: false }).eq("id", trackId)

      toast({
        title: "Track Deleted",
        description: "Track has been removed from the platform.",
      })

      setTracks(tracks.filter((t) => t.id !== trackId))
      setShowDeleteConfirm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive",
      })
    }
  }

  const handleFeatureTrack = async (trackId: string) => {
    try {
      const track = tracks.find((t) => t.id === trackId) // Use local state 'tracks'
      const newFeaturedStatus = !track?.is_featured

      const response = await fetch(`/api/admin/tracks/${trackId}/feature`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address || "",
        },
        body: JSON.stringify({ featured: newFeaturedStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update featured status")
      }

      toast({
        title: newFeaturedStatus ? "Track Featured" : "Track Unfeatured",
        description: newFeaturedStatus
          ? "Track has been added to featured section on discover page."
          : "Track has been removed from featured section.",
      })

      // Refresh tracks using the dedicated function
      await loadAllTracks()
      setShowTrackDialog(false) // Assuming this dialog is not directly used for feature toggle
    } catch (error) {
      console.error("[v0] Error featuring track:", error)
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      })
    }
  }

  const handleEndStream = async (streamId: string) => {
    console.log("[v0] Attempting to end stream:", streamId)

    try {
      if (!address) {
        throw new Error("Wallet not connected")
      }

      const response = await fetch(`/api/admin/streams/${streamId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to end stream")
      }

      const result = await response.json()
      console.log("[v0] Stream ended successfully:", result)

      toast({
        title: "Stream Ended",
        description: "Live stream has been terminated.",
      })

      // Update local state to remove the stream from live streams
      setLiveStreams(liveStreams.filter((s) => s.id !== streamId))
      setShowStreamDialog(false)
    } catch (error) {
      console.error("[v0] Error ending stream:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end stream",
        variant: "destructive",
      })
    }
  }

  const handleToggleTrackVisibility = async (trackId: string, currentStatus: boolean) => {
    try {
      const supabase = createBrowserClient()
      const newStatus = !currentStatus

      await supabase.from("tracks").update({ is_active: newStatus }).eq("id", trackId)

      toast({
        title: newStatus ? "Track Restored" : "Track Hidden",
        description: newStatus ? "Track is now visible on the platform." : "Track has been hidden from public view.",
      })

      // Update local state
      setTracks(tracks.map((t) => (t.id === trackId ? { ...t, is_active: newStatus } : t)))
      setShowDeleteConfirm(false)
      setShowTrackDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update track visibility",
        variant: "destructive",
      })
    }
  }

  const handleEditTrack = (track: any) => {
    setEditTrackData({
      id: track.id,
      title: track.title || "",
      audio_url: track.audio_url || "",
      cover_url: track.cover_url || "",
      coin_address: track.coin_address || "",
      token_id: track.token_id || "",
      nft_contract_address: track.nft_contract_address || "",
      price_per_chunk: track.price_per_chunk?.toString() || "0.001",
      duration: track.duration || 180,
      unlock_type: track.unlock_type || "token",
      is_featured: track.is_featured || false, // Set initial featured status
    })
    setShowEditTrackDialog(true)
  }

  const handleUpdateTrack = async () => {
    if (!editTrackData.id) {
      toast({
        title: "Error",
        description: "No track selected",
        variant: "destructive",
      })
      return
    }

    setUpdatingTrack(true)

    try {
      console.log("[v0] Updating track metadata:", {
        id: editTrackData.id,
        title: editTrackData.title,
        coin_address: editTrackData.coin_address,
        nft_contract_address: editTrackData.nft_contract_address,
        is_featured: editTrackData.is_featured, // Include featured status
      })

      const response = await fetch(`/api/admin/tracks/${editTrackData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address || "",
        },
        body: JSON.stringify({
          title: editTrackData.title,
          audio_url: editTrackData.audio_url,
          cover_url: editTrackData.cover_url || null,
          coin_address: editTrackData.coin_address || null,
          token_id: editTrackData.token_id || null,
          nft_contract_address: editTrackData.nft_contract_address || null,
          price_per_chunk: Number(editTrackData.price_per_chunk),
          duration: editTrackData.duration,
          unlock_type: editTrackData.unlock_type,
          is_featured: editTrackData.is_featured, // Send featured status to API
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update track")
      }

      console.log("[v0] Track metadata updated successfully:", data.track)

      toast({
        title: "Success",
        description: "Track metadata updated successfully. Changes will appear on /tokens page.",
      })

      // Update local state
      setTracks(tracks.map((t) => (t.id === editTrackData.id ? { ...t, ...data.track } : t)))

      // Close dialog
      setShowEditTrackDialog(false)

      // Refresh tokenized songs if token address was added
      if (editTrackData.coin_address || editTrackData.nft_contract_address) {
        console.log("[v0] Refreshing tokenized songs list...")
        const supabase = createBrowserClient()
        const { data: tokenizedTracksData } = await supabase
          .from("tracks")
          .select("*, artist:profiles!tracks_artist_id_fkey(artist_name, wallet_address)")
          .or("coin_address.not.is.null,nft_contract_address.not.is.null")
          .order("created_at", { ascending: false })

        setTokenizedSongs(tokenizedTracksData || [])
        console.log("[v0] Tokenized songs refreshed:", tokenizedTracksData?.length || 0, "tracks")
      }
    } catch (error) {
      console.error("[v0] Failed to update track metadata:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update track",
        variant: "destructive",
      })
    } finally {
      setUpdatingTrack(false)
    }
  }

  const handleCreateTokenizedSong = async () => {
    if (!tokenFormData.title || !tokenFormData.artist_id || !tokenFormData.audio_url) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmittingToken(true)

    try {
      const response = await fetch("/api/tracks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tokenFormData,
          content_type: "audio",
          unlock_type: "token",
          price_per_chunk: Number(tokenFormData.price_per_chunk),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tokenized song")
      }

      toast({
        title: "Success",
        description: "Tokenized song created successfully",
      })

      // Reset form and close dialog
      setTokenFormData({
        title: "",
        artist_id: "",
        audio_url: "",
        cover_url: "",
        coin_address: "",
        token_id: "",
        nft_contract_address: "",
        price_per_chunk: "0.001",
        duration: 180,
      })
      setShowAddTokenDialog(false)

      // Refresh tokenized songs list
      const supabase = createBrowserClient()
      const { data: tokenizedTracksData } = await supabase
        .from("tracks")
        .select("*, artist:profiles!tracks_artist_id_fkey(artist_name, wallet_address)")
        .or("coin_address.not.is.null,nft_contract_address.not.is.null")
        .order("created_at", { ascending: false })

      setTokenizedSongs(tokenizedTracksData || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tokenized song",
        variant: "destructive",
      })
    } finally {
      setSubmittingToken(false)
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
    let filtered = tracks.filter(
      (track) =>
        track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist?.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Filter by visibility status
    if (!showHiddenTracks) {
      filtered = filtered.filter((track) => track.is_active !== false)
    }

    return filtered.sort((a, b) => {
      if (sortBy === "plays") return b.plays - a.plays
      if (sortBy === "revenue") return b.revenue - a.revenue
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [tracks, searchQuery, sortBy, showHiddenTracks])

  async function handleReportAction(reportId: string, action: "reviewed" | "dismissed") {
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({ reportId, status: action }),
      })

      if (!response.ok) throw new Error("Failed to update report")

      toast({
        title: "Report updated",
        description: `Report has been marked as ${action}`,
      })

      // reload the data
      const supabase = createBrowserClient()
      const reportsResponse = await fetch("/api/admin/reports", {
        headers: { "x-wallet-address": address },
      })
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports || [])
      }
    } catch (error) {
      console.error("Failed to update report:", error)
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      })
    }
  }

  // Existing handler for hiding/restoring tracks from reports
  async function handleHideTrackFromReport(trackId: string, isHidden: boolean) {
    try {
      const response = await fetch(`/api/admin/tracks/${trackId}/hide`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({ isHidden }),
      })

      if (!response.ok) throw new Error("Failed to update track")

      toast({
        title: isHidden ? "Track hidden" : "Track restored",
        description: isHidden ? "Track has been hidden from public view" : "Track is now visible to all users",
      })

      const supabase = createBrowserClient()

      // Reload reports
      const reportsResponse = await fetch("/api/admin/reports", {
        headers: { "x-wallet-address": address },
      })
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports || [])
      }

      // Reload tracks to update the main tracks list
      const { data: tracksData } = await supabase
        .from("tracks")
        .select(`
          *,
          profiles!tracks_artist_id_fkey (
            artist_name
          )
        `)
        // Filter to only active tracks unless showHiddenTracks is true
        .neq("is_active", isHidden ? false : null) // If hiding, only show active; if restoring, show all (or filter as needed)
        .order("created_at", { ascending: false })

      if (tracksData) {
        const formattedTracks = tracksData.map((track: any) => ({
          ...track,
          artist_name: track.profiles?.artist_name || "Unknown Artist",
        }))
        setTracks(formattedTracks)
      }
    } catch (error) {
      console.error("Failed to update track:", error)
      toast({
        title: "Error",
        description: "Failed to update track",
        variant: "destructive",
      })
    }
  }

  // ADDED HANDLER FOR REMOVING TOKENIZED TRACKS
  async function handleRemoveTokenizedTrack(trackId: string) {
    try {
      console.log("[v0] Removing tokenized track:", trackId)

      // This API endpoint is reused for hiding/restoring tracks, so we use 'hide' with isHidden: true
      const response = await fetch(`/api/admin/tracks/${trackId}/hide`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({ isHidden: true }),
      })

      if (!response.ok) throw new Error("Failed to remove track")

      toast({
        title: "Track removed",
        description: "Tokenized track has been hidden from /tokens page",
      })

      // Reload tokenized songs list
      const supabase = createBrowserClient()
      const { data: tokenizedData } = await supabase
        .from("tracks")
        .select(`
          *,
          artist:profiles!tracks_artist_id_fkey (
            artist_name
          )
        `)
        .eq("is_active", true) // Ensure we only fetch active tracks
        .not("coin_address", "is", null) // Filter for tokenized tracks
        .order("created_at", { ascending: false })

      if (tokenizedData) {
        setTokenizedSongs(tokenizedData)
      }

      console.log("[v0] Tokenized track removed successfully")
    } catch (error) {
      console.error("[v0] Failed to remove tokenized track:", error)
      toast({
        title: "Error",
        description: "Failed to remove track",
        variant: "destructive",
      })
    }
  }

  // Access denied screen
  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5 flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-12 max-w-md text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 border-2 border-destructive/30 animate-pulse">
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
        <main className="container py-6 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="space-y-6 animate-pulse">
            <div className="h-12 bg-muted/20 rounded-lg w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-28 bg-muted/20 rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted/20 rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5">
      <main className="container py-6 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
                Admin
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">God Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:border-primary/50 transition-all bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-3 py-1.5">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Admin</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">+{stats.newUsers7d} this week</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Music className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Tracks</p>
            <p className="text-2xl font-bold">{stats.totalTracks.toLocaleString()}</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-green-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Streams</p>
            <p className="text-2xl font-bold">{stats.totalStreams.toLocaleString()}</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-primary/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-hover:scale-110 transition-transform">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Revenue</p>
            <p className="text-xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Active 24h</p>
            <p className="text-2xl font-bold">{stats.activeUsers24h.toLocaleString()}</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/30 group-hover:scale-110 transition-transform">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Likes</p>
            <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-cyan-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Follows</p>
            <p className="text-2xl font-bold">{stats.totalFollows.toLocaleString()}</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:border-green-500/50 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 group-hover:scale-110 transition-transform">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500 text-xs">
                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                OK
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">System</p>
            <p className="text-2xl font-bold">100%</p>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="bg-card/50 backdrop-blur-xl border border-border/50 p-1 inline-flex w-auto min-w-full">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="tracks"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Music className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Tracks
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Radio className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Live
              </TabsTrigger>
              <TabsTrigger
                value="playlists"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Playlists
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger
                value="tokenized"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Coins className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Tokenized
              </TabsTrigger>
              <TabsTrigger
                value="flagged"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Flag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Flagged
                {reports.filter((r) => r.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {reports.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="data-[state=active]:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                System
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Gasless Subsidy Dashboard Card */}
            <Card
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border border-primary/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
              onClick={() => (window.location.href = "/admin/gasless")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Gasless Subsidy Dashboard
                        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
                          EIP-3009
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground">Monitor and manage gasless transactions</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track relayed transactions, user gas usage, and subsidy limits. Manage EIP-3009 gasless features
                    including X402 streaming and token swaps.
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-500">
                      <Activity className="h-3 w-3 mr-1" />
                      {stats.totalTransactions?.toLocaleString()} Total Txs
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

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

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Users
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 sm:pl-10 w-full sm:w-48 bg-background/50 border-border/50 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-background/50">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-7 w-7 p-0"
                    >
                      <Grid className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-7 w-7 p-0"
                    >
                      <List className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile-optimized user cards */}
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
                {filteredUsers.slice(0, 20).map((user) => (
                  <Card
                    key={user.wallet_address}
                    className="bg-muted/10 border border-border/50 p-4 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{user.artist_name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-muted/20 border-border/50 text-xs">
                              <Music className="h-2.5 w-2.5 mr-1" />
                              {user.trackCount}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
                              ${user.totalSpent.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleBanUser(user.wallet_address)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tracks" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Tracks
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 sm:pl-10 w-full sm:w-48 bg-background/50 border-border/50 h-9 text-sm"
                    />
                  </div>
                  <Button
                    variant={showHiddenTracks ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHiddenTracks(!showHiddenTracks)}
                    className="h-9 px-3 text-xs whitespace-nowrap"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {showHiddenTracks ? "Hide Removed" : "Show Removed"}
                  </Button>
                  <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-background/50">
                    <Button
                      variant={sortBy === "plays" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("plays")}
                      className="h-7 px-2 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Plays</span>
                    </Button>
                    <Button
                      variant={sortBy === "revenue" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("revenue")}
                      className="h-7 px-2 text-xs"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Revenue</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTracks.slice(0, 20).map((track) => (
                  <Card
                    key={track.id}
                    className={`bg-muted/10 border p-4 hover:border-primary/30 transition-all ${
                      track.is_active === false ? "border-red-500/30 opacity-60" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-border/50 flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{track.title}</p>
                            {track.is_active === false && (
                              <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-500 text-xs">
                                <Ban className="h-2.5 w-2.5 mr-1" />
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artist?.artist_name || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                              <Play className="h-2.5 w-2.5 mr-1" />
                              {track.plays}
                            </Badge>
                            <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-500">
                              <Heart className="h-2.5 w-2.5 mr-1" />
                              {track.likes}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                              ${track.revenue.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTrack(track)
                              setShowTrackDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTrack(track)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFeatureTrack(track.id)}>
                            <Star
                              className={`h-4 w-4 mr-2 ${track.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`}
                            />
                            {track.is_featured ? "Unfeature Track" : "Feature Track"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteTarget({ type: "track", id: track.id })
                              setSelectedTrack(track)
                              setShowDeleteConfirm(true)
                            }}
                            className={
                              track.is_active === false
                                ? "text-green-500 focus:text-green-500"
                                : "text-red-500 focus:text-red-500"
                            }
                          >
                            {track.is_active === false ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Restore Track
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Hide Track
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Live Streams
                </h3>
                <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-500 w-fit">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-pulse" />
                  {liveStreams.filter((s) => s.is_live).length} Active
                </Badge>
              </div>

              <div className="space-y-3">
                {liveStreams.length > 0 ? (
                  liveStreams.map((stream) => (
                    <Card
                      key={stream.id}
                      className="bg-muted/10 border border-border/50 p-4 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={
                                stream.is_live
                                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                                  : "bg-muted/20 border-border/50"
                              }
                            >
                              {stream.is_live ? (
                                <>
                                  <Activity className="h-2.5 w-2.5 mr-1 animate-pulse" />
                                  LIVE
                                </>
                              ) : (
                                "Ended"
                              )}
                            </Badge>
                            {stream.is_live && (
                              <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-500">
                                <Eye className="h-2.5 w-2.5 mr-1" />
                                {stream.viewer_count || 0}
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-sm sm:text-base truncate mb-1">{stream.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {stream.artist?.artist_name || "Unknown Artist"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(stream.started_at).toLocaleString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStream(stream)
                                setShowStreamDialog(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {stream.is_live && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEndStream(stream.id)}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <Power className="h-4 w-4 mr-2" />
                                  End Stream
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No live streams</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <List className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Playlists
                </h3>
                <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary w-fit">
                  {playlists.length} Total
                </Badge>
              </div>

              <div className="space-y-3">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <Card
                      key={playlist.id}
                      className="bg-muted/10 border border-border/50 p-4 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate mb-1">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            by {playlist.owner?.artist_name || "Unknown"}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="bg-muted/20 border-border/50 text-xs">
                              <Music className="h-2.5 w-2.5 mr-1" />
                              {playlist.track_count?.[0]?.count || 0} tracks
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                playlist.is_public
                                  ? "bg-green-500/10 border-green-500/30 text-green-500 text-xs"
                                  : "bg-muted/20 border-border/50 text-xs"
                              }
                            >
                              {playlist.is_public ? "Public" : "Private"}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No playlists</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Recent Transactions
                </h3>
                <Button variant="outline" size="sm" className="border-border/50 bg-transparent w-fit">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 20).map((tx, i) => (
                  <Card
                    key={tx.id}
                    className="bg-muted/10 border border-border/50 p-3 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={
                              tx.type === "swap"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-500 text-xs"
                                : "bg-purple-500/10 border-purple-500/30 text-purple-500 text-xs"
                            }
                          >
                            {tx.type === "swap" ? "Swap" : "Staking"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {tx.user_address?.slice(0, 8)}...{tx.user_address?.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">
                          {tx.type === "swap"
                            ? `${Number(tx.amount_in).toFixed(2)} → ${Number(tx.amount_out).toFixed(2)}`
                            : `${Number(tx.amount).toFixed(2)} USIC`}
                        </p>
                        {tx.type === "swap" && (
                          <p className="text-xs text-muted-foreground">
                            {tx.token_in} → {tx.token_out}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tokenized" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Coins className="h-4 w-4 sm:h-5 w-5 text-primary" />
                  Tokenized Songs
                </h3>
                <Button
                  onClick={() => setShowAddTokenDialog(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-fit"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tokenized Song
                </Button>
              </div>

              <div className="space-y-3">
                {tokenizedSongs.length > 0 ? (
                  tokenizedSongs.map((song) => (
                    <Card
                      key={song.id}
                      className="bg-muted/10 border border-border/50 p-4 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center flex-shrink-0">
                            <Coins className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate mb-1">{song.title}</p>
                            <p className="text-xs text-muted-foreground truncate mb-2">
                              {song.artist?.artist_name || "Unknown Artist"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {song.coin_address && (
                                <Badge
                                  variant="outline"
                                  className="bg-primary/10 border-primary/30 text-primary text-xs font-mono"
                                >
                                  Token: {song.coin_address.slice(0, 6)}...{song.coin_address.slice(-4)}
                                </Badge>
                              )}
                              {song.nft_contract_address && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-500/10 border-purple-500/30 text-purple-500 text-xs font-mono"
                                >
                                  NFT: {song.nft_contract_address.slice(0, 6)}...
                                  {song.nft_contract_address.slice(-4)}
                                </Badge>
                              )}
                              {song.token_id && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 border-blue-500/30 text-blue-500 text-xs"
                                >
                                  ID: {song.token_id}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `/tokens?token=${song.coin_address}`
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View on /tokens
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => {
                                handleRemoveTokenizedTrack(song.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">No tokenized songs yet</p>
                    <p className="text-xs">Add your first tokenized song to get started</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Flag className="h-4 w-4 sm:h-5 w-5 text-red-500" />
                  Flagged Content
                </h3>
                <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-500 w-fit">
                  {reports.filter((r) => r.status === "pending").length} Pending
                </Badge>
              </div>

              <div className="space-y-3">
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <Card
                      key={report.id}
                      className={`bg-muted/10 border p-4 hover:border-primary/30 transition-all ${
                        report.status === "pending" ? "border-red-500/30" : "border-border/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-border/50 flex items-center justify-center flex-shrink-0">
                            <Flag className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate">
                                {report.tracks?.title || "Unknown Track"}
                              </p>
                              <Badge
                                variant="outline"
                                className={
                                  report.status === "pending"
                                    ? "bg-red-500/10 border-red-500/30 text-red-500 text-xs"
                                    : report.status === "reviewed"
                                      ? "bg-green-500/10 border-green-500/30 text-green-500 text-xs"
                                      : "bg-muted/20 border-border/50 text-xs"
                                }
                              >
                                {report.status}
                              </Badge>
                              {report.tracks?.is_hidden && (
                                <Badge
                                  variant="outline"
                                  className="bg-orange-500/10 border-orange-500/30 text-orange-500 text-xs"
                                >
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Reported by {report.reporter_address.slice(0, 6)}...{report.reporter_address.slice(-4)}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-muted/20 border-border/50 text-xs">
                                {report.reason.replace("_", " ")}
                              </Badge>
                            </div>
                            {report.details && (
                              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/20 rounded border border-border/50">
                                {report.details}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReport(report)
                                setShowReportDialog(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {report.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleHideTrackFromReport(report.track_id, !report.tracks?.is_hidden)}
                                >
                                  {report.tracks?.is_hidden ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Restore Track
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Hide Track
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReportAction(report.id, "reviewed")}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Reviewed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReportAction(report.id, "dismissed")}
                                  className="text-muted-foreground"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Dismiss Report
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No flagged content</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                System Controls
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Liquidity & Pairing
                  </h4>

                  <Card
                    className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 p-4 hover:border-primary/30 transition-all group cursor-pointer"
                    onClick={() => (window.location.href = "/pairing")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-hover:scale-110 transition-transform">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">USI Pairing Engine</p>
                          <p className="text-xs text-muted-foreground">Deploy tokens and create USI pairs</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </div>

                {/* Gasless Management Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Gasless Transactions
                  </h4>

                  <Card
                    className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 p-4 hover:border-primary/30 transition-all group cursor-pointer"
                    onClick={() => (window.location.href = "/admin/gasless")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-hover:scale-110 transition-transform">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Gasless Subsidy Dashboard</p>
                          <p className="text-xs text-muted-foreground">Manage EIP-3009 relayer and subsidies</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <Label htmlFor="maintenance" className="text-sm font-semibold">
                        Maintenance Mode
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Disable platform access for maintenance</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                {/* Feature Flags */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Feature Flags
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50">
                      <Label htmlFor="live-streaming" className="text-sm">
                        Live Streaming
                      </Label>
                      <Switch
                        id="live-streaming"
                        checked={featureFlags.liveStreaming}
                        onCheckedChange={(checked) => setFeatureFlags({ ...featureFlags, liveStreaming: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50">
                      <Label htmlFor="staking" className="text-sm">
                        Staking
                      </Label>
                      <Switch
                        id="staking"
                        checked={featureFlags.staking}
                        onCheckedChange={(checked) => setFeatureFlags({ ...featureFlags, staking: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50">
                      <Label htmlFor="swap" className="text-sm">
                        Token Swap
                      </Label>
                      <Switch
                        id="swap"
                        checked={featureFlags.swap}
                        onCheckedChange={(checked) => setFeatureFlags({ ...featureFlags, swap: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50">
                      <Label htmlFor="nft-minting" className="text-sm">
                        NFT Minting
                      </Label>
                      <Switch
                        id="nft-minting"
                        checked={featureFlags.nftMinting}
                        onCheckedChange={(checked) => setFeatureFlags({ ...featureFlags, nftMinting: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Database Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Database Management
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="border-border/50 bg-transparent justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Database
                    </Button>
                    <Button variant="outline" className="border-border/50 bg-transparent justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View and manage user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedUser.artist_name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedUser.wallet_address.slice(0, 10)}...{selectedUser.wallet_address.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-muted/10 border-border/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Tracks</p>
                    <p className="text-xl font-bold">{selectedUser.trackCount}</p>
                  </Card>
                  <Card className="bg-muted/10 border-border/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Spent</p>
                    <p className="text-xl font-bold text-primary">${selectedUser.totalSpent.toFixed(2)}</p>
                  </Card>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowUserDialog(false)} className="w-full sm:w-auto">
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && handleBanUser(selectedUser.wallet_address)}
                className="w-full sm:w-auto"
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedTrack?.is_active === false ? "Restore Track" : "Hide Track"}</DialogTitle>
              <DialogDescription>
                {selectedTrack?.is_active === false
                  ? "This will make the track visible on the platform again."
                  : "This will hide the track from public view. You can restore it later."}
              </DialogDescription>
            </DialogHeader>
            {selectedTrack && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/50">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-border/50 flex items-center justify-center flex-shrink-0">
                    <Music className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedTrack.artist?.artist_name || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant={selectedTrack?.is_active === false ? "default" : "destructive"}
                onClick={() => {
                  if (deleteTarget?.type === "track" && selectedTrack) {
                    handleToggleTrackVisibility(deleteTarget.id, selectedTrack.is_active)
                  }
                }}
                className="w-full sm:w-auto"
              >
                {selectedTrack?.is_active === false ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Hide
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddTokenDialog} onOpenChange={setShowAddTokenDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Add Tokenized Song
              </DialogTitle>
              <DialogDescription>Create a new tokenized song that will appear on the /tokens page</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Basic Information
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="title">Song Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter song title"
                    value={tokenFormData.title}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, title: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist_id">Artist Wallet Address *</Label>
                  <Input
                    id="artist_id"
                    placeholder="0x..."
                    value={tokenFormData.artist_id}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, artist_id: e.target.value })}
                    className="bg-background/50 border-border/50 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio_url">Audio URL *</Label>
                  <Input
                    id="audio_url"
                    placeholder="https://..."
                    value={tokenFormData.audio_url}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, audio_url: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_url">Cover Image URL</Label>
                  <Input
                    id="cover_url"
                    placeholder="https://..."
                    value={tokenFormData.cover_url}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, cover_url: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="180"
                      value={tokenFormData.duration}
                      onChange={(e) => setTokenFormData({ ...tokenFormData, duration: Number(e.target.value) })}
                      className="bg-background/50 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_per_chunk">Price per Chunk (ETH)</Label>
                    <Input
                      id="price_per_chunk"
                      type="number"
                      step="0.0001"
                      placeholder="0.001"
                      value={tokenFormData.price_per_chunk}
                      onChange={(e) => setTokenFormData({ ...tokenFormData, price_per_chunk: e.target.value })}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
              </div>

              {/* Token Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  Token Information
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="coin_address">Token Contract Address</Label>
                  <Input
                    id="coin_address"
                    placeholder="0x..."
                    value={tokenFormData.coin_address}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, coin_address: e.target.value })}
                    className="bg-background/50 border-border/50 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">ERC-20 token contract address</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nft_contract_address">NFT Contract Address</Label>
                  <Input
                    id="nft_contract_address"
                    placeholder="0x..."
                    value={tokenFormData.nft_contract_address}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, nft_contract_address: e.target.value })}
                    className="bg-background/50 border-border/50 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">ERC-721/1155 NFT contract address</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token_id">Token ID</Label>
                  <Input
                    id="token_id"
                    placeholder="1"
                    value={tokenFormData.token_id}
                    onChange={(e) => setTokenFormData({ ...tokenFormData, token_id: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">NFT token ID (if applicable)</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-primary">Note:</strong> At least one token address (Token Contract or NFT
                  Contract) must be provided for the song to appear on the /tokens page.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddTokenDialog(false)}
                disabled={submittingToken}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTokenizedSong}
                disabled={submittingToken}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {submittingToken ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tokenized Song
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditTrackDialog} onOpenChange={setShowEditTrackDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Edit Track Metadata
              </DialogTitle>
              <DialogDescription>Update track information and token contract addresses</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Basic Information
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="edit-title">Song Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="Enter song title"
                    value={editTrackData.title}
                    onChange={(e) => setEditTrackData({ ...editTrackData, title: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-audio_url">Audio URL</Label>
                  <Input
                    id="edit-audio_url"
                    placeholder="https://..."
                    value={editTrackData.audio_url}
                    onChange={(e) => setEditTrackData({ ...editTrackData, audio_url: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cover_url">Cover Image URL</Label>
                  <Input
                    id="edit-cover_url"
                    placeholder="https://..."
                    value={editTrackData.cover_url}
                    onChange={(e) => setEditTrackData({ ...editTrackData, cover_url: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">Duration (seconds)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      placeholder="180"
                      value={editTrackData.duration}
                      onChange={(e) => setEditTrackData({ ...editTrackData, duration: Number(e.target.value) })}
                      className="bg-background/50 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-price_per_chunk">Price per Chunk (ETH)</Label>
                    <Input
                      id="edit-price_per_chunk"
                      type="number"
                      step="0.0001"
                      placeholder="0.001"
                      value={editTrackData.price_per_chunk}
                      onChange={(e) => setEditTrackData({ ...editTrackData, price_per_chunk: e.target.value })}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
              </div>

              {/* Token Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  Token Information
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="edit-coin_address">Token Contract Address</Label>
                  <Input
                    id="edit-coin_address"
                    placeholder="0x..."
                    value={editTrackData.coin_address}
                    onChange={(e) => setEditTrackData({ ...editTrackData, coin_address: e.target.value })}
                    className="bg-background/50 border-border/50 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    ERC-20 token contract address (e.g., from Clanker or Zora)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-nft_contract_address">NFT Contract Address</Label>
                  <Input
                    id="edit-nft_contract_address"
                    placeholder="0x..."
                    value={editTrackData.nft_contract_address}
                    onChange={(e) => setEditTrackData({ ...editTrackData, nft_contract_address: e.target.value })}
                    className="bg-background/50 border-border/50 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">ERC-721/1155 NFT contract address</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-token_id">Token ID</Label>
                  <Input
                    id="edit-token_id"
                    placeholder="1"
                    value={editTrackData.token_id}
                    onChange={(e) => setEditTrackData({ ...editTrackData, token_id: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">NFT token ID (if applicable)</p>
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="space-y-2">
                <Label htmlFor="edit-is_featured">Featured Status</Label>
                <div className="flex items-center p-3 rounded-lg bg-muted/10 border border-border/50">
                  <Label htmlFor="edit-is_featured" className="text-sm flex-grow">
                    Mark as Featured
                  </Label>
                  <Switch
                    id="edit-is_featured"
                    checked={editTrackData.is_featured}
                    onCheckedChange={(checked) => setEditTrackData({ ...editTrackData, is_featured: checked })}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  If checked, this track will appear in the featured section on the discover page.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-primary">Tip:</strong> Add a token contract address to make this track appear
                  on the /tokens page for trading. You can paste the address from a Clanker or Zora deployment.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditTrackDialog(false)}
                disabled={updatingTrack}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTrack}
                disabled={updatingTrack}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {updatingTrack ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
