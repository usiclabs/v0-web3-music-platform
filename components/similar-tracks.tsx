"use client"

import { useEffect, useState } from "react"
import { Sparkles } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { TrackCard } from "@/components/track-card"

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
  play_count: number
  duration?: number
  price_per_chunk?: number
  unlock_type?: string
  content_type?: string
}

interface SimilarTracksProps {
  trackId: string
}

export default function SimilarTracks({ trackId }: SimilarTracksProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const response = await fetch(`/api/tracks/${trackId}/similar`)
        if (response.ok) {
          const data = await response.json()
          setTracks(data)
        }
      } catch (error) {
        console.error("Failed to fetch similar tracks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [trackId])

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  if (tracks.length === 0) {
    return null
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Similar Tracks</h2>
          <p className="text-sm text-muted-foreground">You might also like</p>
        </div>
      </div>

      {/* Track Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </Card>
  )
}
