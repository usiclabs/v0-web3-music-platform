"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Users, Music, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Artist {
  wallet_address: string
  artist_name: string | null
  avatar_url: string | null
  bio: string | null
  trackCount: number
  followerCount: number
  playCount: number
  totalEarnings: number
}

export function FeaturedArtistsCarousel() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    async function fetchArtists() {
      try {
        const response = await fetch("/api/artists/featured")
        if (response.ok) {
          const data = await response.json()
          setArtists(data)
        }
      } catch (error) {
        console.error("Failed to fetch featured artists:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArtists()
  }, [])

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (artists.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % artists.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [artists.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + artists.length) % artists.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % artists.length)
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="h-64 rounded-lg bg-muted/50 animate-pulse" />
      </Card>
    )
  }

  if (artists.length === 0) {
    return null
  }

  const visibleArtists = [
    artists[(currentIndex - 1 + artists.length) % artists.length],
    artists[currentIndex],
    artists[(currentIndex + 1) % artists.length],
  ]

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 shadow-lg shadow-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Featured Artists</h2>
            <p className="text-sm text-muted-foreground mt-1">Top creators on the platform</p>
          </div>
        </div>
        <Link href="/artists">
          <Button variant="outline" size="sm" className="border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 text-red-400 hover:text-red-300">
            View All
          </Button>
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {visibleArtists.map((artist, index) => {
            const isCenter = index === 1
            return (
              <Link
                key={artist.wallet_address}
                href={`/artist/${artist.wallet_address}`}
                className={`group transition-all duration-500 ${
                  isCenter ? "md:scale-105 z-10" : "md:scale-95 opacity-70 hover:opacity-100"
                }`}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 border-2 ${
                  isCenter 
                    ? "border-red-500 shadow-[0_0_30px_rgba(255,30,30,0.6)] bg-gradient-to-br from-red-950/20 to-transparent" 
                    : "border-red-900/40 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(255,30,30,0.4)]"
                } p-6 h-full flex flex-col items-center text-center`}>
                  {/* Background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative flex flex-col items-center space-y-4">
                    {/* Avatar with enhanced styling */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 to-red-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-300" />
                      <Avatar className={`relative h-28 w-28 ring-4 transition-all duration-300 ${
                        isCenter 
                          ? "ring-red-500/60" 
                          : "ring-red-900/40 group-hover:ring-red-500/50"
                      }`}>
                        <AvatarImage src={artist.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-red-600 to-red-700 text-white">
                          {artist.artist_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-xl group-hover:text-red-400 transition-colors line-clamp-2">
                      {artist.artist_name ||
                        `${artist.wallet_address.slice(0, 6)}...${artist.wallet_address.slice(-4)}`}
                    </h3>

                    {/* Stats Grid */}
                    <div className="w-full grid grid-cols-3 gap-3 py-4 border-y border-red-500/20">
                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <Music className="h-4 w-4 text-red-400/70" />
                        <span className="text-sm font-semibold text-white">{artist.trackCount}</span>
                        <span className="text-xs text-muted-foreground">Tracks</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <Users className="h-4 w-4 text-red-400/70" />
                        <span className="text-sm font-semibold text-white">{artist.followerCount}</span>
                        <span className="text-xs text-muted-foreground">Fans</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <TrendingUp className="h-4 w-4 text-red-400/70" />
                        <span className="text-sm font-semibold text-white">{artist.playCount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">Plays</span>
                      </div>
                    </div>

                    {/* Earnings Badge */}
                    <div className="w-full mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 backdrop-blur-sm">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Total Earnings</p>
                      <p className="text-lg font-bold text-red-400">${artist.totalEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrev}
            className="h-10 w-10 rounded-full border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Dots */}
          <div className="flex items-center gap-2 mx-4">
            {artists.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "w-8 h-2.5 bg-red-500 shadow-lg shadow-red-500/50" 
                    : "w-2.5 h-2.5 bg-red-500/40 hover:bg-red-500/60"
                }`}
              />
            ))}
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNext}
            className="h-10 w-10 rounded-full border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
