"use client"

import { ProfileForm } from "@/components/profile-form"
import { User, History, Heart, Users, ListMusic, Sparkles } from "lucide-react"
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

  const loadProfile = async () => {
    if (!address) {
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient()

      const { data: profileData } = await ensureProfile(address)
      setProfile(profileData)

      const { data: streams } = await supabase
        .from("streams")
        .select(`
          *,
          tracks:tracks!inner(
            *,
            artist:profiles!tracks_artist_id_fkey(*)
          )
        `)
        .eq("listener_address", address.toLowerCase())
        .order("last_played_at", { ascending: false })

      setListeningHistory(streams || [])

      const { data: likes } = await supabase
        .from("likes")
        .select(`
          track_id,
          created_at,
          tracks:tracks!inner(
            *,
            artist:profiles!tracks_artist_id_fkey(*)
          )
        `)
        .eq("user_address", address.toLowerCase())
        .order("created_at", { ascending: false })

      if (likes) {
        const likedTracksData = likes.map((like: any) => like.tracks)
        setLikedTracks(likedTracksData)
      }

      const { data: followersData } = await supabase
        .from("follows")
        .select(`
          follower_address,
          created_at,
          follower:profiles!follows_follower_address_fkey(*)
        `)
        .eq("following_address", address.toLowerCase())
        .order("created_at", { ascending: false })

      if (followersData) {
        const followerAddresses = followersData.map((f: any) => f.follower_address)
        const { data: followerProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("wallet_address", followerAddresses)

        const profileMap = new Map(followerProfiles?.map((p) => [p.wallet_address, p]) || [])
        const followersWithProfiles = followersData.map((f: any) => ({
          ...f,
          follower: profileMap.get(f.follower_address) || {
            wallet_address: f.follower_address,
            artist_name: null,
            avatar_url: null,
          },
        }))
        setFollowers(followersWithProfiles)
      }

      const { data: followingData } = await supabase
        .from("follows")
        .select(`
          following_address,
          created_at,
          following:profiles!follows_following_address_fkey(*)
        `)
        .eq("follower_address", address.toLowerCase())
        .order("created_at", { ascending: false })

      if (followingData) {
        setFollowing(followingData)
      }

      const playlistsResponse = await fetch(`/api/playlists?address=${address}`)
      if (playlistsResponse.ok) {
        const playlistsData = await playlistsResponse.json()
        setPlaylists(playlistsData)
      }

      const { data: aiTracksData } = await supabase
        .from("tracks")
        .select(`
          *,
          artist:profiles!tracks_artist_id_fkey(*)
        `)
        .eq("artist_id", address.toLowerCase())
        .eq("ai_generated", true)
        .order("created_at", { ascending: false })

      if (aiTracksData) {
        setAiTracks(aiTracksData as TrackWithArtist[])
      }
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
      <main className="container py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your profile and view your activity</p>
          </div>

          <Tabs defaultValue="settings" className="w-full">
            <div className="mb-6 sm:mb-8">
              <TabsList className="grid grid-cols-7 w-full h-auto p-1 gap-1 bg-card/50 backdrop-blur-xl border border-border/50">
                <TabsTrigger
                  value="settings"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="Settings"
                >
                  <User className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">Settings</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-creations"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="AI Creations"
                >
                  <Sparkles className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">AI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="liked"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="Liked Songs"
                >
                  <Heart className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">Liked</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="Listening History"
                >
                  <History className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">History</span>
                </TabsTrigger>
                <TabsTrigger
                  value="followers"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="Followers"
                >
                  <Users className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">Followers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="following"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="Following"
                >
                  <Users className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">Following</span>
                </TabsTrigger>
                <TabsTrigger
                  value="playlists"
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  title="Playlists"
                >
                  <ListMusic className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">Playlists</span>
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
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">Your AI Creations</h2>
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
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 sm:p-12 text-center">
                  <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No AI creations yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Create your first AI-generated track
                  </p>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create with AI
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked">
              {likedTracks.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Liked Songs</h2>
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
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 sm:p-12 text-center">
                  <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No liked songs yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Start liking tracks to build your collection
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <ListeningHistory streams={listeningHistory} />
            </TabsContent>

            <TabsContent value="followers">
              {followers.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Followers</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {followers.length} {followers.length === 1 ? "follower" : "followers"}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    {followers.map((follow: any) => (
                      <Link key={follow.follower_address} href={`/artist/${follow.follower_address}`}>
                        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-3 sm:p-4 hover:scale-[1.02] transition-all hover:shadow-2xl hover:shadow-primary/30">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                              <AvatarImage src={follow.follower?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary text-sm sm:text-base">
                                {follow.follower?.artist_name?.[0]?.toUpperCase() || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {follow.follower?.artist_name || "Anonymous Artist"}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 sm:p-12 text-center">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No followers yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Share your profile to gain followers</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following">
              {following.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Following</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {following.length} {following.length === 1 ? "artist" : "artists"}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    {following.map((follow: any) => (
                      <Link key={follow.following_address} href={`/artist/${follow.following_address}`}>
                        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-3 sm:p-4 hover:scale-[1.02] transition-all hover:shadow-2xl hover:shadow-primary/30">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                              <AvatarImage src={follow.following?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary text-sm sm:text-base">
                                {follow.following?.artist_name?.[0]?.toUpperCase() || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {follow.following?.artist_name || "Anonymous Artist"}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 sm:p-12 text-center">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Not following anyone yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Discover artists to follow</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              {playlists.length > 0 ? (
                <div>
                  <div className="mb-4 sm:mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Playlists</h2>
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
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 sm:p-12 text-center">
                  <ListMusic className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No playlists yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Create your first playlist to organize your favorite tracks
                  </p>
                  <CreatePlaylistModal onPlaylistCreated={loadProfile} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
