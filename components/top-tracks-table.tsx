"use client"

import { Card } from "@/components/ui/card"
import { Music, Play, DollarSign } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface TopTracksTableProps {
  tracks: Array<{
    id: string
    title: string
    cover_url: string | null
    streams: number
    revenue: number
    profiles: {
      wallet_address: string
      artist_name: string | null
      avatar_url: string | null
    } | null
  }>
}

export function TopTracksTable({ tracks }: TopTracksTableProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        Top Tracks by Streams
      </h3>

      <div className="space-y-3">
        {tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No tracks yet</div>
        ) : (
          tracks.map((track, index) => (
            <Link
              key={track.id}
              href={`/track/${track.id}`}
              className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-primary/5 transition-colors group"
            >
              <div className="text-lg sm:text-xl font-bold text-muted-foreground w-6 text-center">{index + 1}</div>

              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {track.cover_url ? (
                  <Image src={track.cover_url || "/placeholder.svg"} alt={track.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                  {track.title}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {track.profiles?.artist_name || "Unknown Artist"}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-green-500">
                  <Play className="h-3 w-3" />
                  {track.streams.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  {track.revenue.toFixed(2)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  )
}
