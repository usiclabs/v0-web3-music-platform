"use client"

import { ProfileForm } from "@/components/profile-form"
import {
  User,
  History,
  Heart,
  Users,
  ListMusic,
  Sparkles,
  Music,
  Play,
  TrendingUp,
  Upload,
  DollarSign,
} from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { ensureProfile } from "@/lib/supabase/helpers"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import { createBrowserClient } from "@/lib/supabase/client"
import { ListeningHistory } from "@/components/listening-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrackCard } from "@/components/track-card"
import type { TrackWithArtist } from "@/types/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { CreatePlaylistModal } from "@/components/create-playlist-modal"
import { PlaylistCard } from "@/components/playlist-card"
import { Button } from "@/components/ui/button"
import { ProfileTokenSwapModal } from "@/components/profile-token-swap-modal"
import type { Address } from "viem"
import { RecentlyPlayed } from "@/components/recently-played"

export default function ProfilePage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [listeningHistory, setListeningHistory] = useState<any[]>([])
  const [likedTracks, setLikedTracks] = useState<TrackWithArtist[]>([])
  const [aiTracks, setAiTracks] = useState<TrackWithArtist[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalTracks: 0,
    totalFollowers: 0,
    totalFollowing: 0,
  })
  const [profileTokenMetrics, setProfileTokenMetrics] = useState<{
    marketCap: number
    price: number
  } | null>(null)
  const [showSwapModal, setShowSwapModal] = useState(false)

  const loadProfile = async () => {
    if (!address) {
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient()

      const { data: profileData } = await ensureProfile(address)
      setProfile(profileData)

      if (profileData?.profile_token_address) {
        try {
          const metricsRes = await fetch(`/api/token/metrics/${profileData.profile_token_address}`)
          if (metricsRes.ok) {
            const metrics = await metricsRes.json()
            setProfileTokenMetrics({
              marketCap: metrics.marketCap || 0,
              price: metrics.price || 0,
            })
          }
        } catch (error) {
          console.error("[v0] Failed to fetch profile token metrics:", error)
        }
      }

      const [streamsRes, likesRes, followersRes, followingRes, playlistsRes, aiTracksRes, tracksRes] =
        await Promise.all([
          supabase
            .from("streams")
            .select(
              `
          *,
          tracks:tracks!inner(
            *,
            artist:profiles!tracks_artist_id_fkey(*)
          )
        `,
            )
            .eq("listener_address", address.toLowerCase())
            .order("last_played_at", { ascending: false }),
          supabase
            .from("likes")
            .select(
              `
          track_id,
          created_at,
          tracks:tracks!inner(
            *,
            artist:profiles!tracks_artist_id_fkey(*)
          )
        `,
            )
            .eq("user_address", address.toLowerCase())
            .order("created_at", { ascending: false }),
          supabase
            .from("follows")
            .select(
              `
          follower_address,
          created_at,
          follower:profiles!follows_follower_address_fkey(*)
        `,
            )
            .eq("following_address", address.toLowerCase())
            .order("created_at", { ascending: false }),
          supabase
            .from("follows")
            .select(
              `
          following_address,
          created_at,
          following:profiles!follows_following_address_fkey(*)
        `,
            )
            .eq("follower_address", address.toLowerCase())
            .order("created_at", { ascending: false }),
          fetch(`/api/playlists?address=${address}`),
          supabase
            .from("tracks")
            .select(
              `
          *,
          artist:profiles!tracks_artist_id_fkey(*)
        `,
            )
            .eq("artist_id", address.toLowerCase())
            .eq("ai_generated", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("streams")
            .select("track_id, chunks_played, total_paid, tracks!inner(artist_id)")
            .eq("tracks.artist_id", address.toLowerCase()),
        ])

      setListeningHistory(streamsRes.data || [])

      if (likesRes.data) {
        const likedTracksData = likesRes.data.map((like: any) => like.tracks)
        setLikedTracks(likedTracksData)
      }

      if (followersRes.data) {
        const followerAddresses = followersRes.data.map((f: any) => f.follower_address)
        const { data: followerProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("wallet_address", followerAddresses)

        const profileMap = new Map(followerProfiles?.map((p) => [p.wallet_address, p]) || [])
        const followersWithProfiles = followersRes.data.map((f: any) => ({
          ...f,
          follower: profileMap.get(f.follower_address) || {
            wallet_address: f.follower_address,
            artist_name: null,
            avatar_url: null,
          },
        }))
        setFollowers(followersWithProfiles)
      }

      if (followingRes.data) {
        setFollowing(followingRes.data)
      }

      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json()
        setPlaylists(playlistsData)
      }

      if (aiTracksRes.data) {
        setAiTracks(aiTracksRes.data as TrackWithArtist[])
      }

      const totalPlays = tracksRes.data?.reduce((sum, stream) => sum + stream.chunks_played, 0) || 0

      console.log("[v0] Profile stats calculated:", {
        totalPlays,
        totalTracks: tracksRes.data?.length || 0,
        totalFollowers: followersRes.data?.length || 0,
        totalFollowing: followingRes.data?.length || 0,
      })

      setStats({
        totalPlays,
        totalTracks: tracksRes.data?.length || 0,
        totalFollowers: followersRes.data?.length || 0,
        totalFollowing: followingRes.data?.length || 0,
      })
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [address])

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-8 sm:py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to manage your profile"
            icon={<User className="h-10 w-10 md:h-12 md:w-12 text-primary" />}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-8 sm:py-12 px-4 sm:px-6">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          {profile?.cover_url && (
            <img
              src={profile.cover_url || "/placeholder.svg"}
              alt="Cover"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/80 backdrop-blur-sm hover:bg-black/90"
              onClick={() => {
                alert("Cover photo upload coming soon!")
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Cover
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="container px-4 sm:px-6">
          <div className="relative -mt-16 sm:-mt-20 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl sm:text-4xl font-bold">
                  {profile?.artist_name?.[0]?.toUpperCase() || address?.[2]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>

              {/* Name and Bio */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-balance">
                      {profile?.artist_name || "Anonymous Artist"}
                    </h1>
                    <p className="text-sm text-muted-foreground font-mono">{formatAddress(address!)}</p>
                    {profile?.bio && <p className="mt-2 text-sm sm:text-base text-muted-foreground">{profile.bio}</p>}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-3 sm:p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Plays</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalPlays.toLocaleString()}</p>
                  </Card>
                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 p-3 sm:p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2 mb-1">
                      <Music className="h-4 w-4 text-accent" />
                      <p className="text-xs text-muted-foreground">Tracks</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalTracks}</p>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 p-3 sm:p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalFollowers}</p>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 p-3 sm:p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <p className="text-xs text-muted-foreground">Following</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalFollowing}</p>
                  </Card>
                </div>

                {/* Profile Token Metrics and Swap Button */}
                {profile?.profile_token_address && profileTokenMetrics && (
                  <div className="mt-4 sm:mt-6 space-y-3">
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 p-4 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <p className="text-xs text-muted-foreground">Market Cap</p>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold">
                            {profileTokenMetrics.marketCap >= 1000000
                              ? `$${(profileTokenMetrics.marketCap / 1000000).toFixed(2)}M`
                              : profileTokenMetrics.marketCap >= 1000
                                ? `$${(profileTokenMetrics.marketCap / 1000).toFixed(2)}K`
                                : `$${profileTokenMetrics.marketCap.toFixed(2)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                            onClick={() => {
                              navigator.clipboard.writeText(profile.profile_token_address)
                            }}
                          >
                            Copy CA
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            onClick={() => setShowSwapModal(true)}
                          >
                            Swap
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Recently Played Widget */}
          <div className="mb-8">
            <RecentlyPlayed />
          </div>

          <Tabs defaultValue="settings" className="w-full">
            <div className="mb-6 sm:mb-8">
              <TabsList className="grid grid-cols-7 w-full h-auto p-1.5 gap-1 bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg">
                <TabsTrigger
                  value="settings"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="Settings"
                >
                  <User className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">Settings</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-creations"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="AI Creations"
                >
                  <Sparkles className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">AI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="liked"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="Liked Songs"
                >
                  <Heart className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">Liked</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="Listening History"
                >
                  <History className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">History</span>
                </TabsTrigger>
                <TabsTrigger
                  value="followers"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="Followers"
                >
                  <Users className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">Followers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="following"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="Following"
                >
                  <Users className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">Following</span>
                </TabsTrigger>
                <TabsTrigger
                  value="playlists"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2.5 min-h-[48px] rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-foreground"
                  title="Playlists"
                >
                  <ListMusic className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">Playlists</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="settings">
              <ProfileForm profile={profile} walletAddress={address} />
            </TabsContent>

            <TabsContent value="ai-creations">
              {aiTracks.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-6 w-6 text-accent" />
                      <h2 className="text-xl sm:text-2xl font-bold">Your AI Creations</h2>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {aiTracks.length} AI-generated {aiTracks.length === 1 ? "track" : "tracks"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {aiTracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 p-8 sm:p-12 text-center">
                  <div className="bg-accent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-accent" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No AI creations yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    Create your first AI-generated track and showcase your creativity
                  </p>
                  <Link href="/create">
                    <Button className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create with AI
                    </Button>
                  </Link>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="liked">
              {likedTracks.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-6 w-6 text-red-500" />
                      <h2 className="text-xl sm:text-2xl font-bold">Your Liked Songs</h2>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {likedTracks.length} {likedTracks.length === 1 ? "track" : "tracks"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {likedTracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20 p-8 sm:p-12 text-center">
                  <div className="bg-red-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No liked songs yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    Start liking tracks to build your personal collection
                  </p>
                  <Link href="/discover">
                    <Button variant="outline" className="border-red-500/20 hover:bg-red-500/10 bg-transparent">
                      Discover Music
                    </Button>
                  </Link>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history">
              <ListeningHistory streams={listeningHistory} />
            </TabsContent>

            <TabsContent value="followers">
              {followers.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-6 w-6 text-purple-500" />
                      <h2 className="text-xl sm:text-2xl font-bold">Your Followers</h2>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {followers.length} {followers.length === 1 ? "follower" : "followers"}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {followers.map((follow: any) => (
                      <Link key={follow.follower_address} href={`/artist/${follow.follower_address}`}>
                        <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 p-4 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 transition-all group">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-purple-500/30 group-hover:border-purple-500/50 transition-colors">
                              <AvatarImage src={follow.follower?.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-500">
                                {follow.follower?.artist_name?.[0]?.toUpperCase() || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-purple-500 transition-colors">
                                {follow.follower?.artist_name || "Anonymous Artist"}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate font-mono">
                                {formatAddress(follow.follower_address)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 p-8 sm:p-12 text-center">
                  <div className="bg-purple-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No followers yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Share your profile to gain followers and grow your audience
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="following">
              {following.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-6 w-6 text-green-500" />
                      <h2 className="text-xl sm:text-2xl font-bold">Following</h2>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {following.length} {following.length === 1 ? "artist" : "artists"}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {following.map((follow: any) => (
                      <Link key={follow.following_address} href={`/artist/${follow.following_address}`}>
                        <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 p-4 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 transition-all group">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-green-500/30 group-hover:border-green-500/50 transition-colors">
                              <AvatarImage src={follow.following?.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-500">
                                {follow.following?.artist_name?.[0]?.toUpperCase() || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-green-500 transition-colors">
                                {follow.following?.artist_name || "Anonymous Artist"}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate font-mono">
                                {formatAddress(follow.following_address)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 p-8 sm:p-12 text-center">
                  <div className="bg-green-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Not following anyone yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    Discover and follow artists to stay updated with their latest releases
                  </p>
                  <Link href="/artists">
                    <Button variant="outline" className="border-green-500/20 hover:bg-green-500/10 bg-transparent">
                      Discover Artists
                    </Button>
                  </Link>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              {playlists.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ListMusic className="h-6 w-6 text-orange-500" />
                        <h2 className="text-xl sm:text-2xl font-bold">Your Playlists</h2>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
                      </p>
                    </div>
                    <CreatePlaylistModal onPlaylistCreated={loadProfile} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {playlists.map((playlist) => (
                      <PlaylistCard key={playlist.id} playlist={playlist} />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20 p-8 sm:p-12 text-center">
                  <div className="bg-orange-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <ListMusic className="h-10 w-10 text-orange-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No playlists yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    Create your first playlist to organize your favorite tracks
                  </p>
                  <CreatePlaylistModal onPlaylistCreated={loadProfile} />
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Native Swap Modal */}
      {showSwapModal && profile?.profile_token_address && (
        <ProfileTokenSwapModal
          tokenAddress={profile.profile_token_address as Address}
          tokenName={profile.artist_name || "Profile Token"}
          tokenSymbol={profile.artist_name?.toUpperCase().slice(0, 4)}
          onClose={() => setShowSwapModal(false)}
        />
      )}
    </div>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
