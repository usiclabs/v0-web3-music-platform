"use client"

import { useEffect, useState } from "react"
import { History, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TrackCard } from "@/components/track-card"
import { useWallet } from "@/lib/web3/wallet-context"

interface Track {
  id: string
  title: string
  artist_id: string
  cover_url: string | null
  audio_url: string
  duration?: number
  price_per_chunk?: number
  unlock_type?: string
  content_type?: string
  artist: {
    artist_name: string | null
    avatar_url: string | null
  }
}

interface Stream {
  id: string
  track_id: string
  last_played_at: string
  tracks: Track
}

export function RecentlyPlayed() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const { address } = useWallet()

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    async function fetchRecent() {
      try {
        const response = await fetch(`/api/streams/recent?userAddress=${address}`)
        if (response.ok) {
          const data = await response.json()
          setStreams(data.slice(0, 10))
        }
      } catch (error) {
        console.error("Failed to fetch recent plays:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecent()
  }, [address])

  if (!address || loading) {
    return null
  }

  if (streams.length === 0) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-gray-500">
            <History className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">Recently Played</h2>
        </div>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No listening history yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-gray-500">
          <History className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Recently Played</h2>
          <p className="text-sm text-muted-foreground">Your listening history</p>
        </div>
      </div>

      {/* Track Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {streams.map((stream) => (
          <TrackCard key={stream.id} track={stream.tracks} />
        ))}
      </div>
    </Card>
  )
}
