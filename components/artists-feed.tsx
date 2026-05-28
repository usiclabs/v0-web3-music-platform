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
              className="relative min-h-screen w-full snap-start snap-always flex items-center justify-center"
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

              <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 md:p-8 lg:p-12">
                {/* Top Badge */}
                <div className="flex items-center justify-between animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 backdrop-blur-sm">
                    <div className="relative">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
                      <div className="absolute inset-0 bg-red-500/50 blur-xl" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-red-400">#{index + 1} ARTIST</span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-5 pb-4 md:pb-8 max-w-3xl">
                  {/* Artist Header Section */}
                  <Link href={`/artist/${artist.wallet_address}`} className="block group">
                    <div className="flex items-start gap-4 md:gap-5 animate-fade-in">
                      {/* Avatar */}
                      <Avatar className="h-16 w-16 md:h-20 md:w-20 border-3 md:border-4 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.4)] group-hover:border-red-400 group-hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-all duration-500 relative flex-shrink-0">
                        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <AvatarImage src={artist.avatar_url || undefined} className="relative z-10" />
                        <AvatarFallback className="bg-gradient-to-br from-red-500/40 to-red-500/20 text-red-300 text-xl md:text-2xl relative z-10 font-bold">
                          {artist.artist_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Artist Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <FriendActivityBadge userAddress={artist.wallet_address} />
                        </div>
                        <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
                          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white text-balance leading-tight group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
                            {artist.artist_name || "Unknown Artist"}
                          </h1>
                          {artist.verified && <VerifiedBadge size="lg" />}
                        </div>
                        <p className="text-xs md:text-sm text-white/60 font-mono tracking-wider">{formatAddress(artist.wallet_address)}</p>
                      </div>
                    </div>
                  </Link>

                  {/* Bio Section */}
                  {artist.bio && (
                    <p
                      className="text-base md:text-lg text-white/80 leading-relaxed max-w-3xl text-pretty animate-fade-in font-light"
                      style={{ animationDelay: "100ms" }}
                    >
                      {artist.bio}
                    </p>
                  )}

                  {/* Premium Stats Card */}
                  <div
                    className="w-full rounded-2xl md:rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-background/50 to-red-500/5 backdrop-blur-xl overflow-hidden animate-fade-in hover:border-red-500/40 transition-all duration-300"
                    style={{ animationDelay: "200ms" }}
                  >
                    {/* Primary Stat - Earnings */}
                    <div className="p-6 md:p-8 border-b border-red-500/10 bg-gradient-to-r from-red-500/10 to-transparent">
                      <p className="text-xs md:text-sm font-bold text-white/70 mb-3 md:mb-4 tracking-widest uppercase letter-spacing">Total Earnings</p>
                      <div className="flex items-baseline gap-3 md:gap-4">
                        <span className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 leading-none">
                          ${artist.totalEarned.toFixed(4)}
                        </span>
                        <span className="text-xs md:text-sm text-white/60">USDC</span>
                      </div>
                      <p className="text-xs text-white/50 mt-3">All-time earnings</p>
                    </div>

                    {/* Secondary Metrics Grid - 2 Column */}
                    <div className="grid grid-cols-2 divide-x divide-red-500/10">
                      {/* Tracks */}
                      <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center hover:bg-red-500/5 transition-colors duration-300 group/stat">
                        <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-500/30 to-red-500/10 mb-4 group-hover/stat:scale-110 transition-transform duration-300 shadow-lg shadow-red-500/20">
                          <Music className="h-6 w-6 md:h-7 md:w-7 text-red-400" />
                        </div>
                        <span className="font-serif font-bold text-3xl md:text-4xl text-white">{artist.trackCount}</span>
                        <span className="text-xs md:text-sm text-white/60 mt-2 font-medium tracking-wider uppercase">Tracks</span>
                      </div>

                      {/* Followers */}
                      <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center hover:bg-red-500/5 transition-colors duration-300 group/stat">
                        <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-500/30 to-red-500/10 mb-4 group-hover/stat:scale-110 transition-transform duration-300 shadow-lg shadow-red-500/20">
                          <Users className="h-6 w-6 md:h-7 md:w-7 text-red-400" />
                        </div>
                        <span className="font-serif font-bold text-3xl md:text-4xl text-white">{artist.followerCount}</span>
                        <span className="text-xs md:text-sm text-white/60 mt-2 font-medium tracking-wider uppercase">Followers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {index < artists.length - 1 && (
                <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
                  <span className="text-xs font-semibold text-white/70 tracking-widest">SCROLL</span>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-primary to-transparent rounded-full" />
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
