"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Radio, Play } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface LiveStreamCardProps {
  stream: {
    id: string
    title: string
    description?: string
    is_live: boolean
    viewer_count: number
    playback_id: string
    artist: {
      artist_name: string
      avatar_url?: string
      wallet_address: string
    }
  }
}

export function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const [imageError, setImageError] = useState(false)
  const thumbnailUrl = `https://livepeer.studio/api/asset/${stream.playback_id}/thumbnail.jpg`

  return (
    <Link href={`/live/${stream.id}`} className="block group">
      <Card className="overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {!imageError ? (
            <>
              <img
                src={thumbnailUrl || "/placeholder.svg"}
                alt={stream.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
              <Radio className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>

          {/* Live Badge */}
          {stream.is_live && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/50 px-2.5 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold tracking-wide">LIVE</span>
                </div>
              </Badge>
            </div>
          )}

          {/* Viewer Count */}
          {stream.is_live && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <Eye className="h-3.5 w-3.5 text-white" />
              <span className="text-xs text-white font-semibold">{stream.viewer_count.toLocaleString()}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {stream.title}
          </h3>

          {/* Artist Info */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7 ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
              <AvatarImage src={stream.artist.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                {stream.artist.artist_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
              {stream.artist.artist_name ||
                `${stream.artist.wallet_address.slice(0, 6)}...${stream.artist.wallet_address.slice(-4)}`}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
