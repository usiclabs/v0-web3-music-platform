"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Music, DollarSign, Users, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FriendActivityBadge } from "@/components/friend-activity-badge"
import Link from "next/link"
import { ProfileTokenSwapModal } from "@/components/profile-token-swap-modal"
import { VerifiedBadge } from "@/components/verified-badge"
import type { Address } from "viem"

type Artist = {
  wallet_address: string
  artist_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  totalEarned: number
  trackCount: number
  followerCount: number
  profile_token_address?: string | null
  verified?: boolean // Add verified field to type
}

interface ArtistsFeedProps {
  artists: Artist[]
}

export function ArtistsFeed({ artists }: ArtistsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scrollOffsets, setScrollOffsets] = useState<number[]>(new Array(artists.length).fill(0))
  const [profileTokenMetrics, setProfileTokenMetrics] = useState<Record<string, { marketCap: number }>>({})
  const [swapModalToken, setSwapModalToken] = useState<{
    address: Address
    name: string
    symbol?: string
  } | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const tokenizedArtists = artists.filter((a) => a.profile_token_address)
      console.log(`[v0] Fetching metrics for ${tokenizedArtists.length} tokenized artists`)

      const metricsPromises = tokenizedArtists.map(async (artist) => {
        try {
          const tokenAddress = artist.profile_token_address
          console.log(`[v0] Fetching metrics for token: ${tokenAddress}`)

          const res = await fetch(`/api/token/metrics/${tokenAddress}`)
          if (res.ok) {
            const metrics = await res.json()
            console.log(`[v0] Got metrics for ${artist.wallet_address}:`, metrics)
            return { address: artist.wallet_address, marketCap: metrics.marketCap || 0 }
          } else {
            console.error(`[v0] API returned status ${res.status} for ${tokenAddress}`)
          }
        } catch (error) {
          console.error(`[v0] Failed to fetch metrics for ${artist.wallet_address}:`, error)
        }
        return { address: artist.wallet_address, marketCap: 0 }
      })

      const results = await Promise.all(metricsPromises)
      const metricsMap = results.reduce(
        (acc, { address, marketCap }) => {
          acc[address] = { marketCap }
          return acc
        },
        {} as Record<string, { marketCap: number }>,
      )
      console.log(`[v0] Market cap metrics map:`, metricsMap)
      setProfileTokenMetrics(metricsMap)
    }

    if (artists.length > 0) {
      fetchMetrics()
    }
  }, [artists])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const itemHeight = window.innerHeight
      const index = Math.round(scrollTop / itemHeight)
      setCurrentIndex(index)

      const newOffsets = artists.map((_, i) => {
        const cardTop = i * itemHeight
        const cardBottom = cardTop + itemHeight
        const viewportTop = scrollTop
        const viewportBottom = scrollTop + itemHeight

        if (cardBottom < viewportTop - itemHeight || cardTop > viewportBottom + itemHeight) {
          return 0
        }

        const cardCenter = cardTop + itemHeight / 2
        const viewportCenter = scrollTop + itemHeight / 2
        const distanceFromCenter = cardCenter - viewportCenter

        return distanceFromCenter * 0.1
      })

      setScrollOffsets(newOffsets)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [artists.length])

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (artists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4 animate-pulse">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            No Artists Found
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Try adjusting your filters or check back later for new artists!
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll overflow-x-clip snap-y snap-mandatory scroll-smooth hide-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {artists.map((artist, index) => {
          const parallaxOffset = scrollOffsets[index] || 0

          return (
            <div
              key={artist.wallet_address}
              className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
            >
              <div
                className="absolute inset-0 z-0"
                style={{
                  transform: `translateY(${parallaxOffset}px)`,
                  willChange: "transform",
                }}
              >
                {artist.avatar_url ? (
                  <>
                    <Image
                      src={artist.avatar_url || "/placeholder.svg"}
                      alt={artist.artist_name || "Artist"}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background/80" />
                )}
              </div>

              <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-12">
                <div className="flex items-center gap-2 text-white/90 animate-fade-in">
                  <div className="relative">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div className="absolute inset-0 bg-primary/50 blur-xl" />
                  </div>
                  <span className="text-sm font-medium">#{index + 1} Artist</span>
                </div>

                <div className="space-y-6 pb-20 md:pb-8">
                  <Link href={`/artist/${artist.wallet_address}`} className="block group">
                    <div className="flex items-center gap-4 mb-4 animate-fade-in-up">
                      <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-white/30 shadow-2xl group-hover:border-primary group-hover:scale-110 transition-all duration-300 relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <AvatarImage src={artist.avatar_url || undefined} className="relative z-10" />
                        <AvatarFallback className="bg-primary/20 text-primary text-3xl md:text-4xl relative z-10">
                          {artist.artist_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FriendActivityBadge userAddress={artist.wallet_address} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-3xl md:text-6xl font-bold text-white text-balance leading-tight group-hover:text-primary transition-all duration-300">
                            {artist.artist_name || "Unknown Artist"}
                          </h1>
                          {artist.verified && <VerifiedBadge size="lg" />}
                        </div>
                        <p className="text-base md:text-lg text-white/70">{formatAddress(artist.wallet_address)}</p>
                      </div>
                    </div>
                  </Link>

                  {artist.bio && (
                    <p
                      className="text-base md:text-xl text-white/90 leading-relaxed max-w-3xl text-balance animate-fade-in-up"
                      style={{ animationDelay: "100ms" }}
                    >
                      {artist.bio}
                    </p>
                  )}

                  <div
                    className="grid grid-cols-3 gap-4 sm:gap-5 md:gap-8 max-w-4xl w-full animate-fade-in-up"
                    style={{ animationDelay: "200ms" }}
                  >
                    <div className="flex flex-col items-center text-center p-5 sm:p-6 md:p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 hover:border-white/40 hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-xl">
                      <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 mb-3 md:mb-4 group-hover:scale-125 transition-transform relative">
                        <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary relative z-10" />
                      </div>
                      <span className="font-bold text-xl sm:text-2xl md:text-4xl text-white animate-green-glow leading-tight">
                        {artist.totalEarned.toFixed(4)}
                      </span>
                      <span className="text-xs sm:text-sm md:text-base text-white/70 mt-2 font-medium">USDC Earned</span>
                    </div>

                    <div className="flex flex-col items-center text-center p-5 sm:p-6 md:p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 hover:border-white/40 hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-xl">
                      <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 mb-3 md:mb-4 group-hover:scale-125 transition-transform relative">
                        <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Music className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary relative z-10" />
                      </div>
                      <span className="font-bold text-xl sm:text-2xl md:text-4xl text-white leading-tight">{artist.trackCount}</span>
                      <span className="text-xs sm:text-sm md:text-base text-white/70 mt-2 font-medium">Tracks</span>
                    </div>

                    <div className="flex flex-col items-center text-center p-5 sm:p-6 md:p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 hover:border-white/40 hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-xl">
                      <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 mb-3 md:mb-4 group-hover:scale-125 transition-transform relative">
                        <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary relative z-10" />
                      </div>
                      <span className="font-bold text-xl sm:text-2xl md:text-4xl text-white leading-tight">{artist.followerCount}</span>
                      <span className="text-xs sm:text-sm md:text-base text-white/70 mt-2 font-medium">Followers</span>
                    </div>
                  </div>



                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto mt-2 md:mt-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                    <Link
                      href={`/artist/${artist.wallet_address}`}
                      className="flex-1 sm:flex-none"
                    >
                      <Button
                        size="lg"
                        className="w-full h-13 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-full bg-gradient-to-r from-primary/80 to-primary/60 hover:from-primary hover:to-primary/80 hover:scale-105 active:scale-95 backdrop-blur-xl border border-primary/50 hover:border-primary transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-base sm:text-lg md:text-xl font-semibold text-white relative group"
                      >
                        <span className="relative z-10">View Profile</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto h-13 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-full bg-white/5 hover:bg-white/15 hover:scale-105 active:scale-95 backdrop-blur-xl border border-white/30 hover:border-white/50 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-base sm:text-lg md:text-xl font-semibold text-white relative group"
                    >
                      <span className="relative z-10">Follow</span>
                    </Button>
                  </div>
                </div>
              </div>

              {index < artists.length - 1 && (
                <div className="absolute bottom-32 md:bottom-24 right-6 z-20 animate-bounce">
                  <div className="h-8 w-0.5 bg-gradient-to-b from-white/50 to-transparent rounded-full" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {swapModalToken && (
        <ProfileTokenSwapModal
          tokenAddress={swapModalToken.address}
          tokenName={swapModalToken.name}
          tokenSymbol={swapModalToken.symbol}
          onClose={() => setSwapModalToken(null)}
        />
      )}
    </>
  )
}
