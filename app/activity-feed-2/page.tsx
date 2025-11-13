"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Heart, UserPlus, Radio, Coins, Play, Clock, ActivityIcon, Sparkles, Zap } from "lucide-react"
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
  user_has_profile?: boolean
  target_user_address?: string
  target_user_name?: string
  target_user_avatar?: string
  target_user_has_profile?: boolean
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

export default function ActivityFeed2Page() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "social" | "financial" | "live">("all")
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

      // Load follows
      const { data: follows } = await supabase
        .from("follows")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (follows && follows.length > 0) {
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
            user_has_profile: !!followerProfile,
            target_user_address: follow.following_address,
            target_user_name: followingProfile?.artist_name,
            target_user_avatar: followingProfile?.avatar_url,
            target_user_has_profile: !!followingProfile,
            created_at: follow.created_at,
          })
        })
      }

      // Load likes
      const { data: likes } = await supabase
        .from("likes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (likes && likes.length > 0) {
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
            user_has_profile: !!profile,
            track_id: like.track_id,
            track_title: track?.title,
            track_cover: track?.cover_url,
            created_at: like.created_at,
          })
        })
      }

      // Load streams
      const { data: streams } = await supabase
        .from("streams")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50)

      if (streams && streams.length > 0) {
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

      // Load live streams
      const { data: liveStreams } = await supabase
        .from("live_streams")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50)

      if (liveStreams && liveStreams.length > 0) {
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
            user_has_profile: !!profile,
            stream_id: stream.id,
            stream_title: stream.title,
            created_at: stream.started_at || stream.created_at,
          })
        })
      }

      // Load swaps
      const { data: swaps } = await supabase
        .from("swap_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (swaps && swaps.length > 0) {
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
            user_has_profile: !!profile,
            token_symbol: swap.token_out,
            token_amount: swap.amount_out,
            created_at: swap.created_at,
          })
        })
      }

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(activities)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscriptions() {
    const streamsChannel = supabase
      .channel("activity-streams-2")
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
      .subscribe()

    return () => {
      supabase.removeChannel(streamsChannel)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true
    if (filter === "social") return ["follow", "like", "stream"].includes(activity.type)
    if (filter === "financial") return ["swap"].includes(activity.type)
    if (filter === "live") return ["live_stream_start"].includes(activity.type)
    return true
  })

  function getActivityIcon(type: ActivityType) {
    const iconClass = "h-5 w-5"

    switch (type) {
      case "follow":
        return <UserPlus className={`${iconClass} text-blue-500`} />
      case "like":
        return <Heart className={`${iconClass} text-red-500 fill-red-500`} />
      case "stream":
        return <Play className={`${iconClass} text-purple-500 fill-purple-500`} />
      case "live_stream_start":
        return <Radio className={`${iconClass} text-orange-500`} />
      case "swap":
        return <Coins className={`${iconClass} text-yellow-500`} />
      default:
        return <ActivityIcon className={iconClass} />
    }
  }

  function getActivityText(activity: ActivityItem) {
    const userName = activity.user_name || `${activity.user_address.slice(0, 6)}...${activity.user_address.slice(-4)}`

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
              <span className="font-semibold">{userName}</span>
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
              <span className="font-semibold">{targetName}</span>
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
              <span className="font-semibold">{userName}</span>
            )}
            {" liked "}
            <Link href={`/track/${activity.track_id}`} className="font-semibold hover:text-red-400 transition-colors">
              {activity.track_title}
            </Link>
          </>
        )
      case "stream":
        const isPaidUnlock = activity.total_paid && activity.total_paid > 0
        const cleanTitle = activity.track_title?.replace(/[0O]$/g, "").trim() || activity.track_title
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
              <span className="font-semibold">{userName}</span>
            )}
            {" streamed "}
            <Link
              href={`/track/${activity.track_id}`}
              className={`font-semibold transition-colors ${isPaidUnlock ? "hover:text-yellow-400" : "hover:text-purple-400"}`}
            >
              {cleanTitle}
            </Link>
            {isPaidUnlock && (
              <span className="inline-flex items-center gap-1 ml-2 text-yellow-400 font-semibold">
                <Coins className="h-4 w-4" />
                {activity.total_paid.toFixed(4)} USDC
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
              <span className="font-semibold">{userName}</span>
            )}
            {" started a live stream "}
            <Link
              href={`/live/${activity.stream_id}`}
              className="font-semibold hover:text-orange-400 transition-colors inline-flex items-center gap-2"
            >
              {activity.stream_title}
              <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
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
              <span className="font-semibold">{userName}</span>
            )}
            {" bought "}
            <span className="font-semibold text-yellow-400 inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {amount} ${activity.token_symbol}
            </span>
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
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-40" />
              <div className="relative bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white tracking-tight">Activity Feed</h1>
              <p className="text-lg text-white/60">Real-time platform pulse</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-full px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm text-green-400 font-medium">LIVE</span>
            </div>
            <span className="text-sm text-white/40">{filteredActivities.length} activities</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className={`rounded-full ${
                filter === "all"
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <ActivityIcon className="h-4 w-4 mr-2" />
              All
            </Button>
            <Button
              variant={filter === "social" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("social")}
              className={`rounded-full ${
                filter === "social"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Heart className="h-4 w-4 mr-2" />
              Social
            </Button>
            <Button
              variant={filter === "financial" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("financial")}
              className={`rounded-full ${
                filter === "financial"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Coins className="h-4 w-4 mr-2" />
              Financial
            </Button>
            <Button
              variant={filter === "live" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("live")}
              className={`rounded-full ${
                filter === "live"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
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
            <ActivityIcon className="h-20 w-20 text-white/40 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No activity yet</h3>
            <p className="text-white/60 text-lg">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <Card
                key={activity.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-start gap-6">
                  {activity.user_has_profile ? (
                    <Link href={`/artist/${activity.user_address}`} className="flex-shrink-0">
                      <Avatar className="h-14 w-14 border-2 border-white/20 hover:border-white/40 transition-all">
                        <AvatarImage
                          src={
                            activity.user_avatar ||
                            `https://api.dicebear.com/7.x/shapes/svg?seed=${activity.user_address || "/placeholder.svg"}`
                          }
                          alt={activity.user_name || activity.user_address}
                        />
                        <AvatarFallback className="bg-white/10 text-white font-semibold">
                          {(activity.user_name?.[0] || activity.user_address.slice(2, 4)).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Avatar className="h-14 w-14 border-2 border-white/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${activity.user_address}`} />
                      <AvatarFallback className="bg-white/10 text-white font-semibold">
                        {activity.user_address.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {(activity.type === "like" || activity.type === "stream") && activity.track_cover && (
                    <Link href={`/track/${activity.track_id}`} className="flex-shrink-0">
                      <div className="h-14 w-14 rounded-xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all">
                        <Image
                          src={activity.track_cover || "/placeholder.svg"}
                          alt={activity.track_title || "Track"}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-base text-white/90 leading-relaxed">{getActivityText(activity)}</p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-white/40">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
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
    </div>
  )
}
