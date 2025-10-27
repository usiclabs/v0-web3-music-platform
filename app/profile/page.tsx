"use client"

import { ProfileForm } from "@/components/profile-form"
import { User, History, Heart, Users } from "lucide-react"
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

export default function ProfilePage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [listeningHistory, setListeningHistory] = useState<any[]>([])
  const [likedTracks, setLikedTracks] = useState<TrackWithArtist[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])

  useEffect(() => {
    async function loadProfile() {
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
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setLoading(false)
      }
    }

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
            <div className="mb-6 sm:mb-8 relative">
              {/* Fade indicators for mobile scroll */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />

              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto sm:grid sm:w-full sm:max-w-3xl sm:grid-cols-5 h-auto sm:h-10 p-1 gap-1">
                  <TabsTrigger
                    value="settings"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Settings</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="liked"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2"
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Liked</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2"
                  >
                    <History className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>History</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="followers"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Followers</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="following"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Following</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="settings">
              <ProfileForm profile={profile} walletAddress={address} />
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
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
