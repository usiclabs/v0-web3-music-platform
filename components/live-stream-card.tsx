"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Radio } from "lucide-react"
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
    <Link href={`/live/${stream.id}`}>
      <Card className="group overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 hover-lift transition-all">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {!imageError ? (
            <img
              src={thumbnailUrl || "/placeholder.svg"}
              alt={stream.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Radio className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Live Badge */}
          {stream.is_live && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white border-0 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </div>
          )}

          {/* Viewer Count */}
          {stream.is_live && (
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Eye className="h-3 w-3 text-white" />
              <span className="text-xs text-white font-medium">{stream.viewer_count}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {stream.title}
          </h3>

          {/* Artist Info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={stream.artist.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {stream.artist.artist_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {stream.artist.artist_name ||
                `${stream.artist.wallet_address.slice(0, 6)}...${stream.artist.wallet_address.slice(-4)}`}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
