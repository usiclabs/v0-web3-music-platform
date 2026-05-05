"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Music, DollarSign, Users, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

                <div className="space-y-5 md:space-y-8 pb-12 md:pb-8">
                  <Link href={`/artist/${artist.wallet_address}`} className="block group">
                    <div className="flex items-center gap-4 md:gap-6 animate-fade-in-up">
                      <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/40 shadow-[0_0_40px_rgba(0,0,0,0.8)] group-hover:border-primary group-hover:shadow-[0_0_60px_rgba(0,0,0,0.9)] group-hover:scale-110 transition-all duration-300 relative flex-shrink-0">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <AvatarImage src={artist.avatar_url || undefined} className="relative z-10" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/20 text-primary text-2xl md:text-3xl relative z-10 font-bold">
                          {artist.artist_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <FriendActivityBadge userAddress={artist.wallet_address} />
                        </div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h1 className="text-2xl md:text-5xl font-bold text-white text-balance leading-tight group-hover:text-primary transition-all duration-300 line-clamp-2">
                            {artist.artist_name || "Unknown Artist"}
                          </h1>
                          {artist.verified && <VerifiedBadge size="lg" />}
                        </div>
                        <p className="text-sm md:text-base text-white/60">{formatAddress(artist.wallet_address)}</p>
                      </div>
                    </div>
                  </Link>

                  {artist.bio && (
                    <p
                      className="text-base md:text-lg text-white/80 leading-relaxed max-w-3xl text-balance animate-fade-in-up line-clamp-3"
                      style={{ animationDelay: "100ms" }}
                    >
                      {artist.bio}
                    </p>
                  )}

                  {/* Unified Stats Card */}
                  <div
                    className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: "200ms" }}
                  >
                    {/* Main Earnings Section */}
                    <div className="p-6 md:p-8 border-b border-white/10">
                      <p className="text-xs md:text-sm font-semibold text-white/60 mb-2 tracking-wider">USDC EARNED</p>
                      <div className="flex items-end gap-3 mb-1">
                        <span className="font-bold text-3xl md:text-5xl text-white leading-none">{artist.totalEarned.toFixed(4)}</span>
                        <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary/70 mb-1" />
                      </div>
                      <p className="text-xs md:text-sm text-white/60">All time earnings</p>
                    </div>

                    {/* Secondary Metrics - 2 Column Grid */}
                    <div className="grid grid-cols-2 divide-x divide-white/10">
                      <div className="p-5 md:p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 mb-3 group-hover:scale-110 transition-transform">
                          <Music className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <span className="font-bold text-2xl md:text-3xl text-white">{artist.trackCount}</span>
                        <span className="text-xs md:text-sm text-white/60 mt-1">Tracks</span>
                      </div>

                      <div className="p-5 md:p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 mb-3 group-hover:scale-110 transition-transform">
                          <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <span className="font-bold text-2xl md:text-3xl text-white">{artist.followerCount}</span>
                        <span className="text-xs md:text-sm text-white/60 mt-1">Followers</span>
                      </div>
                    </div>
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
