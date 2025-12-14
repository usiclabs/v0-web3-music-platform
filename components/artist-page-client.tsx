"use client"

import { useState } from "react"
import { TrackCard } from "@/components/track-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { TrackWithArtist } from "@/types/database"
import { DollarSign, Music, Play, Users, Radio, Sparkles, TrendingUp, Zap } from "lucide-react"
import { FollowButton } from "@/components/follow-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListeningHistory } from "@/components/listening-history"
import { FollowersList } from "@/components/followers-list"
import { FollowingList } from "@/components/following-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CopyTokenAddressButton } from "@/components/copy-token-address-button"
import { ProfileTokenSwapModal } from "@/components/profile-token-swap-modal"
import { BoostModal } from "@/components/boost-modal"
import { VerifiedBadge } from "@/components/verified-badge"

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
  const [showBoostModal, setShowBoostModal] = useState(false)

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <>
      <div className="min-h-screen relative">
        {/* Blurred Background Layer */}
        <div className="fixed inset-0 z-0">
          {/* Avatar Background Image */}
          {artist.avatar_url && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${artist.avatar_url})`,
                filter: "blur(80px) brightness(0.4)",
                transform: "scale(1.2)",
              }}
            />
          )}
          {/* Fallback gradient if no avatar */}
          {!artist.avatar_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>

        {/* Content Layer */}
        <main className="relative z-10 container py-12 px-4 sm:px-6">
          {/* Artist Header */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary/30">
                <AvatarImage src={artist.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                  {artist.artist_name?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold">{artist.artist_name || "Anonymous Artist"}</h1>
                      {artist.verified && <VerifiedBadge size="lg" />}
                      {isCurrentlyLive && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </div>
                          <span className="text-xs font-semibold text-red-500 uppercase">Live</span>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{formatAddress(artist.wallet_address)}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{followerCount}</span>
                        <span className="text-muted-foreground">followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{followingCount}</span>
                        <span className="text-muted-foreground">following</span>
                      </div>
                    </div>
                  </div>
                  <FollowButton artistAddress={address} initialFollowerCount={followerCount} size="lg" />
                </div>
                {artist.bio && <p className="text-muted-foreground leading-relaxed max-w-2xl mb-4">{artist.bio}</p>}

                {((artist as any).farcaster_url ||
                  (artist as any).x_url ||
                  (artist as any).zora_url ||
                  (artist as any).tiktok_url) && (
                  <div className="flex items-center gap-3 mt-4">
                    {(artist as any).farcaster_url && (
                      <a
                        href={(artist as any).farcaster_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        aria-label="Farcaster"
                      >
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.04 0H3.96A3.96 3.96 0 0 0 0 3.96v16.08A3.96 3.96 0 0 0 3.96 24h16.08A3.96 3.96 0 0 0 24 20.04V3.96A3.96 3.96 0 0 0 20.04 0zM8.4 18H6V8.4h2.4V18zm9.6 0h-2.4v-4.8c0-1.32-1.08-2.4-2.4-2.4s-2.4 1.08-2.4 2.4V18H8.4V8.4h2.4v1.2c.72-.96 1.92-1.6 3.2-1.6 2.64 0 4.8 2.16 4.8 4.8V18z" />
                        </svg>
                      </a>
                    )}
                    {(artist as any).x_url && (
                      <a
                        href={(artist as any).x_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        aria-label="X (Twitter)"
                      >
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 8 12 11.82 4.18 8 12 4.18zM4 9.48l7 3.5v7.84l-7-3.5V9.48zm16 0v7.84l-7 3.5v-7.84l7-3.5z" />
                        </svg>
                      </a>
                    )}
                    {(artist as any).zora_url && (
                      <a
                        href={(artist as any).zora_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        aria-label="Zora"
                      >
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.48l7 3.5v7.84l-7-3.5V9.48zm16 0v7.84l-7 3.5v-7.84l7-3.5z" />
                        </svg>
                      </a>
                    )}
                    {(artist as any).tiktok_url && (
                      <a
                        href={(artist as any).tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        aria-label="TikTok"
                      >
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-${(artist as any).profile_token_address ? "2 lg:grid-cols-4" : "3"} gap-4 mb-8`}
          >
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Music className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tracks</p>
                  <p className="text-2xl font-bold">{tracks?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Plays</p>
                  <p className="text-2xl font-bold">{totalPlays}</p>
                </div>
              </div>
            </div>

            {(artist as any).profile_token_address && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="text-2xl font-bold text-green-500">{profileTokenMarketCap || "Loading..."}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <CopyTokenAddressButton address={(artist as any).profile_token_address} />
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => setShowSwapModal(true)}
                  >
                    Swap
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => setShowBoostModal(true)}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Boost
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8 bg-card/50 backdrop-blur-xl border border-border/50 p-1">
              <TabsTrigger
                value="tracks"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                title="Tracks"
              >
                <Music className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Tracks</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai-creations"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                title="AI Creations"
              >
                <Sparkles className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary relative"
                title="Live Streams"
              >
                <Radio className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Live</span>
                {isCurrentlyLive && (
                  <span className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                title="Listening History"
              >
                <Play className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger
                value="followers"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                title="Followers"
              >
                <Users className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Followers</span>
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 min-h-[44px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                title="Following"
              >
                <Users className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Following</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracks">
              {tracks && tracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track as TrackWithArtist} />
                  ))}
                </div>
              ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-12 text-center">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tracks uploaded yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-creations">
              {aiTracks && aiTracks.length > 0 ? (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-6 w-6 text-accent" />
                      <h2 className="text-2xl font-bold">AI Creations</h2>
                    </div>
                    <p className="text-muted-foreground">
                      {aiTracks.length} AI-generated {aiTracks.length === 1 ? "track" : "tracks"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {aiTracks.map((track) => (
                      <TrackCard key={track.id} track={track as TrackWithArtist} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No AI-generated tracks yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="live">
              {liveStreams && liveStreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveStreams.map((stream) => (
                    <Link
                      key={stream.id}
                      href={`/live/${stream.id}`}
                      className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Radio className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                            {stream.title || "Untitled Stream"}
                          </h3>
                        </div>
                        {stream.is_live && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded-full">
                            <div className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </div>
                            <span className="text-xs font-semibold text-red-500 uppercase">Live</span>
                          </div>
                        )}
                      </div>
                      {stream.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{stream.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {stream.viewer_count !== null && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{stream.viewer_count} watching</span>
                            </div>
                          )}
                        </div>
                        <span>
                          {stream.is_live
                            ? "Live now"
                            : stream.ended_at
                              ? new Date(stream.ended_at).toLocaleDateString()
                              : new Date(stream.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-12 text-center">
                  <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No live streams yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <ListeningHistory streams={streams || []} />
            </TabsContent>

            <TabsContent value="followers">
              <FollowersList followers={followers} />
            </TabsContent>

            <TabsContent value="following">
              <FollowingList following={following} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Native Swap Modal */}
      {showSwapModal && (artist as any).profile_token_address && (
        <ProfileTokenSwapModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          tokenAddress={(artist as any).profile_token_address}
          artistName={artist.artist_name}
        />
      )}

      {/* Boost Modal */}
      {showBoostModal && (
        <BoostModal
          open={showBoostModal}
          onOpenChange={setShowBoostModal}
          artistAddress={address as `0x${string}`}
          artistName={artist.artist_name}
          tokenAddress={(artist as any).profile_token_address as `0x${string}`}
          tokenSymbol={artist.profile_token_symbol || "TOKEN"}
        />
      )}
    </>
  )
}
