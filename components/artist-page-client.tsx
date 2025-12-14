"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Share2, Music, TrendingUp, Users, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProfileTokenSwapModal } from "@/components/profile-token-swap-modal"
import { FollowButton } from "@/components/follow-button"

interface ArtistPageClientProps {
  artist: any
  address: string
  followerCount: number
  followingCount: number
  tracks: any[]
  totalEarnings: number
  totalPlays: number
  profileTokenMarketCap: string | null
  streams: any[]
  liveStreams: any[]
  isCurrentlyLive: boolean
  followers: any[]
  following: any[]
  aiTracks: any[]
}

export function ArtistPageClient({
  artist,
  address,
  followerCount,
  followingCount,
  tracks,
  totalEarnings,
  totalPlays,
  profileTokenMarketCap,
  streams,
  liveStreams,
  isCurrentlyLive,
  followers,
  following,
  aiTracks,
}: ArtistPageClientProps) {
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"tracks" | "streams" | "following">("tracks")
  const [showBoostModal, setShowBoostModal] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatEarnings = (amount: number) => {
    return `$${(amount / 1000000).toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 h-80 bg-gradient-to-b from-accent/10 to-transparent" />

        <div className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <Image
                  src={artist?.avatar_url || `/placeholder.svg?height=160&width=160&query=artist+avatar`}
                  alt={artist?.artist_name || "Artist"}
                  width={160}
                  height={160}
                  className="rounded-full border-4 border-accent/20"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{artist?.artist_name || "Unknown Artist"}</h1>
                <p className="text-muted-foreground mb-4">{address}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(followerCount)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(followingCount)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(totalPlays)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Plays</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatEarnings(totalEarnings)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Earnings</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <FollowButton address={artist?.wallet_address} />
                  {artist?.profile_token_address && (
                    <>
                      <Button onClick={() => setShowSwapModal(true)} className="bg-accent hover:bg-accent/90" size="sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Swap
                      </Button>
                      <Button
                        onClick={() => setShowBoostModal(true)}
                        className="bg-accent/80 hover:bg-accent/70"
                        size="sm"
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Boost
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Indicator */}
            {isCurrentlyLive && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 font-semibold">🔴 LIVE NOW</span>
                </div>
              </div>
            )}

            {/* Profile Token Info */}
            {artist?.profile_token_address && (
              <Card className="mb-8 p-4 sm:p-6 border-accent/20 bg-accent/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">{artist?.artist_name} Token</h3>
                    <p className="text-sm text-muted-foreground">{artist?.profile_token_address}</p>
                  </div>
                  {profileTokenMarketCap && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-accent">{profileTokenMarketCap}</div>
                      <div className="text-xs text-muted-foreground">Market Cap</div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Tabs */}
            <div className="mb-8">
              <div className="flex gap-2 sm:gap-4 border-b border-border overflow-x-auto">
                <button
                  onClick={() => setActiveTab("tracks")}
                  className={`pb-3 px-2 sm:px-4 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                    activeTab === "tracks"
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tracks ({tracks.length})
                </button>
                <button
                  onClick={() => setActiveTab("streams")}
                  className={`pb-3 px-2 sm:px-4 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                    activeTab === "streams"
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Streams ({streams.length})
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`pb-3 px-2 sm:px-4 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                    activeTab === "following"
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Following ({followingCount})
                </button>
              </div>
            </div>

            {/* Content */}
            <div>
              {activeTab === "tracks" && (
                <div className="grid gap-4">
                  {tracks.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No tracks yet</p>
                    </Card>
                  ) : (
                    tracks.map((track) => (
                      <Link key={track.id} href={`/track/${track.id}`}>
                        <Card className="p-4 hover:bg-accent/5 transition-colors cursor-pointer">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0">
                              <Image
                                src={track.cover_url || `/placeholder.svg?height=64&width=64&query=music+cover`}
                                alt={track.title}
                                width={64}
                                height={64}
                                className="rounded"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{track.title}</h3>
                              <p className="text-sm text-muted-foreground">{track.artist?.artist_name}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-sm font-semibold">{track.duration || "0:00"}</div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === "streams" && (
                <div className="grid gap-4">
                  {streams.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No stream history</p>
                    </Card>
                  ) : (
                    streams.map((stream) => (
                      <Card key={stream.id} className="p-4">
                        <div className="flex gap-4">
                          <Image
                            src={
                              stream.tracks?.cover_url ||
                              `/placeholder.svg?height=64&width=64&query=music+cover` ||
                              "/placeholder.svg"
                            }
                            alt={stream.tracks?.title}
                            width={64}
                            height={64}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{stream.tracks?.title}</h3>
                            <p className="text-sm text-muted-foreground">{stream.tracks?.artist?.artist_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(stream.last_played_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              ${(Number(stream.total_paid) / 1000000).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {activeTab === "following" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {following.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">Not following anyone yet</p>
                    </div>
                  ) : (
                    following.map((f) => (
                      <Link key={f.following?.wallet_address} href={`/artist/${f.following?.wallet_address}`}>
                        <Card className="p-4 text-center hover:bg-accent/5 transition-colors cursor-pointer">
                          <Image
                            src={
                              f.following?.avatar_url ||
                              `/placeholder.svg?height=80&width=80&query=artist+avatar` ||
                              "/placeholder.svg"
                            }
                            alt={f.following?.artist_name}
                            width={80}
                            height={80}
                            className="rounded-full mx-auto mb-2"
                          />
                          <p className="font-semibold text-sm truncate">{f.following?.artist_name}</p>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {artist?.profile_token_address && (
        <>
          <ProfileTokenSwapModal
            isOpen={showSwapModal}
            onClose={() => setShowSwapModal(false)}
            tokenAddress={artist.profile_token_address}
            tokenSymbol={artist.artist_name}
          />
          {/* <BoostModal
            open={showBoostModal}
            onOpenChange={setShowBoostModal}
            tokenAddress={artist.profile_token_address}
            tokenSymbol={artist.artist_name}
          /> */}
        </>
      )}
    </div>
  )
}

export default ArtistPageClient
