"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import {
  Heart,
  MessageCircle,
  UserPlus,
  Radio,
  Coins,
  Play,
  Clock,
  ActivityIcon,
  List,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

type ActivityType =
  | "follow"
  | "like"
  | "comment"
  | "livestream_comment"
  | "stream"
  | "live_stream_start"
  | "swap"
  | "playlist_create"

interface ActivityItem {
  id: string
  type: ActivityType
  user_address: string
  user_name?: string
  user_avatar?: string
  user_has_profile?: boolean // Added flag to track if user has a profile
  target_user_address?: string
  target_user_name?: string
  target_user_avatar?: string
  target_user_has_profile?: boolean // Added flag to track if target user has a profile
  track_id?: string
  track_title?: string
  track_cover?: string
  stream_id?: string
  stream_title?: string
  playlist_id?: string
  playlist_name?: string
  comment_content?: string
  token_symbol?: string
  token_amount?: string
  total_paid?: number
  chunks_played?: number
  created_at: string
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "social" | "financial" | "live">("all")
  const { address } = useWallet()
  const supabase = createClient()

  useEffect(() => {
    loadActivities()
    const cleanup = setupRealtimeSubscriptions()
    return cleanup
  }, [])

  async function loadActivities() {
    setLoading(true)
    try {
      const activities: ActivityItem[] = []

      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (followsError) {
        console.error("[v0] Error loading follows:", followsError.message)
      } else if (follows && follows.length > 0) {
        const addresses = Array.from(
          new Set([...follows.map((f) => f.follower_address), ...follows.map((f) => f.following_address)]),
        )
        const { data: profiles } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, avatar_url")
          .in("wallet_address", addresses)

        const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

        follows.forEach((follow) => {
          const followerProfile = profileMap.get(follow.follower_address)
          const followingProfile = profileMap.get(follow.following_address)

          activities.push({
            id: `follow-${follow.id}`,
            type: "follow",
            user_address: follow.follower_address,
            user_name: followerProfile?.artist_name,
            user_avatar: followerProfile?.avatar_url,
            user_has_profile: !!followerProfile, // Track if user has profile
            target_user_address: follow.following_address,
            target_user_name: followingProfile?.artist_name,
            target_user_avatar: followingProfile?.avatar_url,
            target_user_has_profile: !!followingProfile, // Track if target user has profile
            created_at: follow.created_at,
          })
        })
      }

      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (likesError) {
        console.error("[v0] Error loading likes:", likesError.message)
      } else if (likes && likes.length > 0) {
        const userAddresses = Array.from(new Set(likes.map((l) => l.user_address)))
        const trackIds = Array.from(new Set(likes.map((l) => l.track_id)))

        const [profilesRes, tracksRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("wallet_address, artist_name, avatar_url")
            .in("wallet_address", userAddresses),
          supabase.from("tracks").select("id, title, cover_url").in("id", trackIds),
        ])

        const profileMap = new Map(profilesRes.data?.map((p) => [p.wallet_address, p]) || [])
        const trackMap = new Map(tracksRes.data?.map((t) => [t.id, t]) || [])

        likes.forEach((like) => {
          const profile = profileMap.get(like.user_address)
          const track = trackMap.get(like.track_id)

          activities.push({
            id: `like-${like.id}`,
            type: "like",
            user_address: like.user_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile, // Track if user has profile
            track_id: like.track_id,
            track_title: track?.title,
            track_cover: track?.cover_url,
            created_at: like.created_at,
          })
        })
      }

      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (commentsError) {
        console.error("[v0] Error loading comments:", commentsError.message)
      } else if (comments && comments.length > 0) {
        const userAddresses = Array.from(new Set(comments.map((c) => c.user_address)))
        const trackIds = Array.from(new Set(comments.map((c) => c.track_id)))

        const [profilesRes, tracksRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("wallet_address, artist_name, avatar_url")
            .in("wallet_address", userAddresses),
          supabase.from("tracks").select("id, title, cover_url").in("id", trackIds),
        ])

        const profileMap = new Map(profilesRes.data?.map((p) => [p.wallet_address, p]) || [])
        const trackMap = new Map(tracksRes.data?.map((t) => [t.id, t]) || [])

        comments.forEach((comment) => {
          const profile = profileMap.get(comment.user_address)
          const track = trackMap.get(comment.track_id)

          activities.push({
            id: `comment-${comment.id}`,
            type: "comment",
            user_address: comment.user_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile, // Track if user has profile
            track_id: comment.track_id,
            track_title: track?.title,
            track_cover: track?.cover_url,
            comment_content: comment.content,
            created_at: comment.created_at,
          })
        })
      }

      const { data: liveComments, error: liveCommentsError } = await supabase
        .from("livestream_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (liveCommentsError) {
        console.error("[v0] Error loading live comments:", liveCommentsError.message)
      } else if (liveComments && liveComments.length > 0) {
        const userAddresses = Array.from(new Set(liveComments.map((c) => c.user_address)))
        const streamIds = Array.from(new Set(liveComments.map((c) => c.stream_id)))

        const [profilesRes, streamsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("wallet_address, artist_name, avatar_url")
            .in("wallet_address", userAddresses),
          supabase.from("live_streams").select("id, title").in("id", streamIds),
        ])

        const profileMap = new Map(profilesRes.data?.map((p) => [p.wallet_address, p]) || [])
        const streamMap = new Map(streamsRes.data?.map((s) => [s.id, s]) || [])

        liveComments.forEach((comment) => {
          const profile = profileMap.get(comment.user_address)
          const stream = streamMap.get(comment.stream_id)

          activities.push({
            id: `livestream-comment-${comment.id}`,
            type: "livestream_comment",
            user_address: comment.user_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile, // Track if user has profile
            stream_id: comment.stream_id,
            stream_title: stream?.title,
            comment_content: comment.content,
            created_at: comment.created_at,
          })
        })
      }

      const { data: streams, error: streamsError } = await supabase
        .from("streams")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50)

      if (streamsError) {
        console.error("[v0] Error loading streams:", streamsError.message)
      } else if (streams && streams.length > 0) {
        const userAddresses = Array.from(new Set(streams.map((s) => s.listener_address.toLowerCase())))
        const trackIds = Array.from(new Set(streams.map((s) => s.track_id)))

        const [profilesRes, tracksRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("wallet_address, artist_name, avatar_url")
            .in("wallet_address", userAddresses),
          supabase.from("tracks").select("id, title, cover_url").in("id", trackIds),
        ])

        const profileMap = new Map(profilesRes.data?.map((p) => [p.wallet_address, p]) || [])
        const trackMap = new Map(tracksRes.data?.map((t) => [t.id, t]) || [])

        streams.forEach((stream) => {
          const profile = profileMap.get(stream.listener_address.toLowerCase())
          const track = trackMap.get(stream.track_id)

          activities.push({
            id: `stream-${stream.id}`,
            type: "stream",
            user_address: stream.listener_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile,
            track_id: stream.track_id,
            track_title: track?.title,
            track_cover: track?.cover_url,
            total_paid: Number(stream.total_paid) || 0,
            chunks_played: stream.chunks_played || 0,
            created_at: stream.started_at,
          })
        })
      }

      const { data: liveStreams, error: liveStreamsError } = await supabase
        .from("live_streams")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50)

      if (liveStreamsError) {
        console.error("[v0] Error loading live streams:", liveStreamsError.message)
      } else if (liveStreams && liveStreams.length > 0) {
        const artistAddresses = Array.from(new Set(liveStreams.map((s) => s.artist_address)))
        const { data: profiles } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, avatar_url")
          .in("wallet_address", artistAddresses)

        const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

        liveStreams.forEach((stream) => {
          const profile = profileMap.get(stream.artist_address)

          activities.push({
            id: `live-${stream.id}`,
            type: "live_stream_start",
            user_address: stream.artist_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile, // Track if user has profile
            stream_id: stream.id,
            stream_title: stream.title,
            created_at: stream.started_at || stream.created_at,
          })
        })
      }

      const { data: swaps, error: swapsError } = await supabase
        .from("swap_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (swapsError) {
        console.error("[v0] Error loading swaps:", swapsError.message)
      } else if (swaps && swaps.length > 0) {
        const userAddresses = Array.from(new Set(swaps.map((s) => s.user_address)))
        const { data: profiles } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, avatar_url")
          .in("wallet_address", userAddresses)

        const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

        swaps.forEach((swap) => {
          const profile = profileMap.get(swap.user_address)

          activities.push({
            id: `swap-${swap.id}`,
            type: "swap",
            user_address: swap.user_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile, // Track if user has profile
            token_symbol: swap.token_out,
            token_amount: swap.amount_out,
            created_at: swap.created_at,
          })
        })
      }

      const { data: playlists, error: playlistsError } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (playlistsError) {
        console.error("[v0] Error loading playlists:", playlistsError.message)
      } else if (playlists && playlists.length > 0) {
        const ownerAddresses = Array.from(new Set(playlists.map((p) => p.owner_address)))
        const { data: profiles } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, avatar_url")
          .in("wallet_address", ownerAddresses)

        const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

        playlists.forEach((playlist) => {
          const profile = profileMap.get(playlist.owner_address)

          activities.push({
            id: `playlist-${playlist.id}`,
            type: "playlist_create",
            user_address: playlist.owner_address,
            user_name: profile?.artist_name,
            user_avatar: profile?.avatar_url,
            user_has_profile: !!profile, // Track if user has profile
            playlist_id: playlist.id,
            playlist_name: playlist.name,
            created_at: playlist.created_at,
          })
        })
      }

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(activities)
    } catch (error) {
      console.error("[v0] Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscriptions() {
    const followsChannel = supabase
      .channel("activity-follows")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "follows" }, async (payload) => {
        const follow = payload.new
        const { data: profiles } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, avatar_url")
          .in("wallet_address", [follow.follower_address, follow.following_address])

        const followerProfile = profiles?.find((p) => p.wallet_address === follow.follower_address)
        const followingProfile = profiles?.find((p) => p.wallet_address === follow.following_address)

        const newActivity: ActivityItem = {
          id: `follow-${follow.id}`,
          type: "follow",
          user_address: follow.follower_address,
          user_name: followerProfile?.artist_name,
          user_avatar: followerProfile?.avatar_url,
          user_has_profile: !!followerProfile, // Track if user has profile
          target_user_address: follow.following_address,
          target_user_name: followingProfile?.artist_name,
          target_user_avatar: followingProfile?.avatar_url,
          target_user_has_profile: !!followingProfile, // Track if target user has profile
          created_at: follow.created_at,
        }

        setActivities((prev) => [newActivity, ...prev])
      })
      .subscribe()

    const streamsChannel = supabase
      .channel("activity-streams")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "streams" }, async (payload) => {
        const stream = payload.new
        const [profileRes, trackRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("wallet_address, artist_name, avatar_url")
            .eq("wallet_address", stream.listener_address.toLowerCase())
            .single(),
          supabase.from("tracks").select("id, title, cover_url").eq("id", stream.track_id).single(),
        ])

        const newActivity: ActivityItem = {
          id: `stream-${stream.id}`,
          type: "stream",
          user_address: stream.listener_address,
          user_name: profileRes.data?.artist_name,
          user_avatar: profileRes.data?.avatar_url,
          user_has_profile: !!profileRes.data,
          track_id: stream.track_id,
          track_title: trackRes.data?.title,
          track_cover: trackRes.data?.cover_url,
          total_paid: Number(stream.total_paid) || 0,
          chunks_played: stream.chunks_played || 0,
          created_at: stream.started_at,
        }

        setActivities((prev) => [newActivity, ...prev])
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "streams" }, async (payload) => {
        const stream = payload.new

        setActivities((prev) =>
          prev
            .map((activity) => {
              if (activity.id === `stream-${stream.id}`) {
                return {
                  ...activity,
                  total_paid: Number(stream.total_paid) || 0,
                  chunks_played: stream.chunks_played || 0,
                  created_at: stream.started_at, // Update timestamp to show most recent activity
                }
              }
              return activity
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(followsChannel)
      supabase.removeChannel(streamsChannel)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true
    if (filter === "social")
      return ["follow", "like", "comment", "livestream_comment", "stream", "playlist_create"].includes(activity.type)
    if (filter === "financial") return ["swap"].includes(activity.type)
    if (filter === "live") return ["live_stream_start", "livestream_comment"].includes(activity.type)
    return true
  })

  function getActivityIcon(type: ActivityType) {
    const iconClass = "h-5 w-5"
    const wrapperClass = "relative"

    switch (type) {
      case "follow":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <UserPlus className={`${iconClass} text-blue-500 relative z-10`} />
          </div>
        )
      case "like":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <Heart className={`${iconClass} text-red-500 relative z-10 fill-red-500`} />
          </div>
        )
      case "comment":
      case "livestream_comment":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <MessageCircle className={`${iconClass} text-green-500 relative z-10`} />
          </div>
        )
      case "stream":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
            <Play className={`${iconClass} text-purple-500 relative z-10 fill-purple-500`} />
          </div>
        )
      case "live_stream_start":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
            <Radio className={`${iconClass} text-orange-500 relative z-10`} />
          </div>
        )
      case "swap":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping" />
            <Coins className={`${iconClass} text-yellow-500 relative z-10`} />
          </div>
        )
      case "playlist_create":
        return (
          <div className={wrapperClass}>
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
            <List className={`${iconClass} text-cyan-500 relative z-10`} />
          </div>
        )
      default:
        return <ActivityIcon className={iconClass} />
    }
  }

  function getActivityText(activity: ActivityItem) {
    const userName = activity.user_name || `${activity.user_address.slice(0, 6)}...${activity.user_address.slice(-4)}`

    const isAICurator = activity.user_address === "0xAI000000000000000000000000000000CURATOR1"

    switch (activity.type) {
      case "follow":
        const targetName =
          activity.target_user_name ||
          `${activity.target_user_address?.slice(0, 6)}...${activity.target_user_address?.slice(-4)}`
        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-blue-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" started following "}
            {activity.target_user_has_profile ? (
              <Link
                href={`/artist/${activity.target_user_address}`}
                className="font-semibold hover:text-blue-400 transition-colors"
              >
                {targetName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{targetName}</span>
            )}
          </>
        )
      case "like":
        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-red-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" liked "}
            <Link href={`/track/${activity.track_id}`} className="font-semibold hover:text-red-400 transition-colors">
              {activity.track_title}
            </Link>
          </>
        )
      case "comment":
        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-green-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" commented on "}
            <Link href={`/track/${activity.track_id}`} className="font-semibold hover:text-green-400 transition-colors">
              {activity.track_title}
            </Link>
            {activity.comment_content && (
              <span className="block text-sm text-muted-foreground mt-2 italic line-clamp-2 pl-4 border-l-2 border-green-500/30">
                "{activity.comment_content}"
              </span>
            )}
          </>
        )
      case "livestream_comment":
        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-green-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" commented on live stream "}
            <Link
              href={`/live/${activity.stream_id}`}
              className="font-semibold hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              {activity.stream_title}
              <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </span>
            </Link>
          </>
        )
      case "stream":
        const isPaidUnlock = activity.total_paid && activity.total_paid > 0
        const displayAmount = isPaidUnlock ? activity.total_paid.toFixed(4) : null

        const cleanTrackTitle = activity.track_title?.trim() || ""

        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className={`font-semibold transition-colors ${isPaidUnlock ? "hover:text-yellow-400" : "hover:text-purple-400"}`}
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" streamed "}
            <Link
              href={`/track/${activity.track_id}`}
              className={`font-semibold transition-colors ${isPaidUnlock ? "hover:text-yellow-400" : "hover:text-purple-400"}`}
            >
              {cleanTrackTitle}
            </Link>
            {isPaidUnlock && displayAmount && (
              <span className="inline-flex items-center gap-1 ml-2 text-yellow-400 font-semibold">
                <Coins className="h-4 w-4" />
                {displayAmount} USDC
              </span>
            )}
          </>
        )
      case "live_stream_start":
        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-orange-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" started a live stream "}
            <Link
              href={`/live/${activity.stream_id}`}
              className="font-semibold hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              {activity.stream_title}
              <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </span>
            </Link>
          </>
        )
      case "swap":
        const amount = activity.token_amount ? Number.parseFloat(activity.token_amount).toFixed(2) : "0"
        return (
          <>
            {activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-yellow-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" bought "}
            <span className="font-semibold text-yellow-400 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {amount} ${activity.token_symbol}
            </span>
          </>
        )
      case "playlist_create":
        return (
          <>
            {isAICurator ? (
              <Link href="/ai-curator" className="font-semibold hover:text-cyan-400 transition-colors">
                {userName}
              </Link>
            ) : activity.user_has_profile ? (
              <Link
                href={`/artist/${activity.user_address}`}
                className="font-semibold hover:text-cyan-400 transition-colors"
              >
                {userName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground/70 cursor-not-allowed">{userName}</span>
            )}
            {" created a playlist "}
            <Link
              href={`/playlist/${activity.playlist_id}`}
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {activity.playlist_name}
            </Link>
          </>
        )
      default:
        return <span>Unknown activity</span>
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-32">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
        <div className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-40" />
                  <div className="relative bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-2">Activity Feed</h1>
                  <p className="text-lg text-white/60 tracking-wide">Real-time platform pulse</p>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-24">
                <div className="flex items-center gap-2 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-full px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-sm text-green-400 font-medium tracking-wide">LIVE</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-sm text-white/40 tracking-wide">{filteredActivities.length} activities</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">Today</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {
                    filteredActivities.filter(
                      (a) => new Date(a.created_at).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <ActivityIcon className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">Total</span>
                </div>
                <div className="text-2xl font-bold text-white">{filteredActivities.length}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className={`rounded-full px-6 py-2 h-auto font-medium tracking-wide transition-all duration-300 ${
                filter === "all"
                  ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <ActivityIcon className="h-4 w-4 mr-2" />
              All Activity
            </Button>
            <Button
              variant={filter === "social" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("social")}
              className={`rounded-full px-6 py-2 h-auto font-medium tracking-wide transition-all duration-300 ${
                filter === "social"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <Heart className="h-4 w-4 mr-2" />
              Social
            </Button>
            <Button
              variant={filter === "financial" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("financial")}
              className={`rounded-full px-6 py-2 h-auto font-medium tracking-wide transition-all duration-300 ${
                filter === "financial"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <Coins className="h-4 w-4 mr-2" />
              Financial
            </Button>
            <Button
              variant={filter === "live" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("live")}
              className={`rounded-full px-6 py-2 h-auto font-medium tracking-wide transition-all duration-300 ${
                filter === "live"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <Radio className="h-4 w-4 mr-2" />
              Live
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
                <div className="flex items-start gap-6">
                  <div className="h-14 w-14 rounded-full bg-white/10" />
                  {i % 2 === 0 && <div className="h-14 w-14 rounded-xl bg-white/10" />}
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 bg-white/10 rounded-lg" />
                    <div className="h-4 w-1/4 bg-white/10 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-16 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-1 bg-primary/20 blur-3xl rounded-full" />
              <ActivityIcon className="h-20 w-20 text-white/40 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No activity yet</h3>
            <p className="text-white/60 text-lg">Check back soon to see what's happening!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <Card
                key={activity.id}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500 overflow-hidden"
                style={{
                  animation: `slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s backwards`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-purple-500/0 to-pink-500/0 group-hover:from-primary/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 -z-10" />

                <div className="flex items-start gap-6">
                  {activity.user_has_profile ||
                  activity.user_address === "0xAI000000000000000000000000000000CURATOR1" ? (
                    <Link
                      href={
                        activity.user_address === "0xAI000000000000000000000000000000CURATOR1"
                          ? "/ai-curator"
                          : `/artist/${activity.user_address}`
                      }
                      className="flex-shrink-0 relative group/avatar"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full opacity-0 group-hover/avatar:opacity-100 blur-lg transition-all duration-500" />
                      <Avatar className="h-14 w-14 border-2 border-white/20 group-hover/avatar:border-white/40 group-hover/avatar:scale-110 transition-all duration-500 relative z-10">
                        <AvatarImage
                          src={
                            activity.user_avatar ||
                            `https://api.dicebear.com/7.x/shapes/svg?seed=${activity.user_address || "/placeholder.svg"}`
                          }
                          alt={activity.user_name || activity.user_address}
                        />
                        <AvatarFallback className="bg-white/10 text-white font-semibold text-lg">
                          {(activity.user_name?.[0] || activity.user_address.slice(2, 4)).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <div className="flex-shrink-0 relative opacity-60">
                      <Avatar className="h-14 w-14 border-2 border-white/10">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/shapes/svg?seed=${activity.user_address}`}
                          alt={activity.user_address}
                        />
                        <AvatarFallback className="bg-white/10 text-white font-semibold text-lg">
                          {activity.user_address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {(activity.type === "like" || activity.type === "stream" || activity.type === "comment") &&
                    activity.track_cover && (
                      <Link href={`/track/${activity.track_id}`} className="flex-shrink-0 relative group/track">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover/track:opacity-100 blur-lg transition-all duration-500" />
                        <div className="relative z-10 h-14 w-14 rounded-xl overflow-hidden border-2 border-white/20 group-hover/track:border-white/40 group-hover/track:scale-110 transition-all duration-500">
                          <Image
                            src={activity.track_cover || "/placeholder.svg"}
                            alt={activity.track_title || "Track"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>
                    )}

                  {activity.type === "follow" && activity.target_user_avatar && (
                    <>
                      {activity.target_user_has_profile ? (
                        <Link
                          href={`/artist/${activity.target_user_address}`}
                          className="flex-shrink-0 relative group/target"
                        >
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-0 group-hover/target:opacity-100 blur-lg transition-all duration-500" />
                          <Avatar className="h-14 w-14 border-2 border-white/20 group-hover/target:border-white/40 group-hover/target:scale-110 transition-all duration-500 relative z-10">
                            <AvatarImage
                              src={
                                activity.target_user_avatar ||
                                `https://api.dicebear.com/7.x/shapes/svg?seed=${activity.target_user_address || "/placeholder.svg"}`
                              }
                              alt={activity.target_user_name || activity.target_user_address || ""}
                            />
                            <AvatarFallback className="bg-blue-500/20 text-blue-400 font-semibold text-lg">
                              {(
                                activity.target_user_name?.[0] ||
                                activity.target_user_address?.slice(2, 4) ||
                                "U"
                              ).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <div className="flex-shrink-0 relative opacity-60">
                          <Avatar className="h-14 w-14 border-2 border-white/10">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/shapes/svg?seed=${activity.target_user_address}`}
                              alt={activity.target_user_address || ""}
                            />
                            <AvatarFallback className="bg-blue-500/20 text-blue-400 font-semibold text-lg">
                              {(activity.target_user_address?.slice(2, 4) || "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-base text-white/90 leading-relaxed tracking-wide">
                          {getActivityText(activity)}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-white/40">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="tracking-wide">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bg-grid-white\/\[0\.02\] {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 4rem 4rem;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
