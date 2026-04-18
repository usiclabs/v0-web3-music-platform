"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TrackCard } from "@/components/track-card"
import Link from "next/link"

interface Track {
  id: string
  title: string
  artist_id: string
  cover_url: string | null
  audio_url: string
  artist: {
    artist_name: string | null
    avatar_url: string | null
  }
  total_plays: number
  total_listeners: number
  duration?: number
  price_per_chunk?: number
  unlock_type?: string
  content_type?: string
  total_earnings: number
}

const TIME_FILTERS = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "All Time", value: "all" },
]

export function TrendingWidget() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("7d")

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true)
      try {
        const response = await fetch(`/api/tracks/trending?time=${timeFilter}`)
        if (response.ok) {
          const data = await response.json()
          setTracks(data.slice(0, 10))
        }
      } catch (error) {
        console.error("Failed to fetch trending tracks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [timeFilter])

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent">
            <Flame className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Trending Now</h2>
            <p className="text-sm text-muted-foreground">Most played tracks</p>
          </div>
        </div>
        <Link href="/trending">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {TIME_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={timeFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter(filter.value)}
            className={
              timeFilter === filter.value
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                : ""
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Track List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No trending tracks yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tracks.map((track, index) => (
            <div key={track.id} className="relative">
              {/* Rank Badge */}
              <div
                className={`absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : index === 1
                      ? "bg-muted text-muted-foreground"
                      : index === 2
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>

              {/* Earnings Badge */}
              {track.total_earnings > 0 && (
                <div className="absolute -top-2 -right-2 z-10 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-0.5 shadow-lg">
                  {track.total_earnings.toFixed(4)} USDC
                </div>
              )}

              <TrackCard track={track} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
