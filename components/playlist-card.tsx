"use client"

import { Card } from "@/components/ui/card"
import { Music2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface PlaylistCardProps {
  playlist: {
    id: string
    name: string
    description?: string
    cover_image?: string
    playlist_tracks?: any[]
  }
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const trackCount = playlist.playlist_tracks?.[0]?.count || 0

  return (
    <Link href={`/playlist/${playlist.id}`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 group overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/30">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
          {playlist.cover_image ? (
            <Image
              src={playlist.cover_image || "/placeholder.svg"}
              alt={playlist.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 className="h-16 w-16 text-primary/50" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{playlist.name}</h3>
          {playlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{playlist.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {trackCount} {trackCount === 1 ? "track" : "tracks"}
          </p>
        </div>
      </Card>
    </Link>
  )
}
