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
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Featured Artists</h2>
            <p className="text-sm text-muted-foreground">Top creators on the platform</p>
          </div>
        </div>
        <Link href="/artists">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {visibleArtists.map((artist, index) => {
            const isCenter = index === 1
            return (
              <Link
                key={artist.wallet_address}
                href={`/artist/${artist.wallet_address}`}
                className={`group transition-all duration-300 ${
                  isCenter ? "md:scale-110 z-10" : "md:scale-95 opacity-60"
                }`}
              >
                <Card className="p-4 hover:bg-accent/50 transition-all duration-300 hover:shadow-lg">
                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Avatar */}
                    <Avatar className="h-20 w-20 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                      <AvatarImage src={artist.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">{artist.artist_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {artist.artist_name ||
                        `${artist.wallet_address.slice(0, 6)}...${artist.wallet_address.slice(-4)}`}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        <span>{artist.trackCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{artist.followerCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{artist.playCount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="mt-2 text-sm font-semibold text-emerald-500">
                      {artist.totalEarnings.toFixed(4)} USDC earned
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dots */}
          <div className="flex items-center gap-1.5 mx-2">
            {artists.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8 bg-transparent">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
