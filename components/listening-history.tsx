"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, Clock, DollarSign, Play } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ListeningHistoryProps {
  streams: any[]
}

export function ListeningHistory({ streams }: ListeningHistoryProps) {
  if (streams.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-12 text-center">
        <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Listening History Yet</h3>
        <p className="text-muted-foreground mb-6">Start exploring tracks to build your listening history</p>
        <Button asChild>
          <Link href="/explore">
            <Play className="h-4 w-4 mr-2" />
            Explore Tracks
          </Link>
        </Button>
      </Card>
    )
  }

  // Calculate total stats
  const totalChunksPlayed = streams.reduce((sum, s) => sum + s.chunks_played, 0)
  const totalPaid = streams.reduce((sum, s) => sum + Number(s.total_paid), 0)
  const uniqueTracks = new Set(streams.map((s) => s.track_id)).size

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Tracks Played</p>
          </div>
          <p className="text-3xl font-bold">{uniqueTracks}</p>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Total Segments</p>
          </div>
          <p className="text-3xl font-bold">{totalChunksPlayed}</p>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20 border border-chart-3/30">
              <DollarSign className="h-5 w-5 text-chart-3" />
            </div>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
          <p className="text-3xl font-bold">{totalPaid.toFixed(4)} USDC</p>
        </Card>
      </div>

      {/* Listening History List */}
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h3 className="text-lg font-semibold mb-6">Recent Plays</h3>
        <div className="space-y-4">
          {streams.map((stream) => {
            const track = stream.tracks
            const artist = track.artist
            const lastPlayed = new Date(stream.last_played_at)
            const timeAgo = getTimeAgo(lastPlayed)

            return (
              <Link
                key={stream.id}
                href={`/track/${track.id}`}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-primary/30 group"
              >
                {/* Track Cover */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src={track.cover_url || undefined} alt={track.title} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                      <Music className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{track.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{artist.artist_name || "Unknown Artist"}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo}
                    </span>
                    <span>{stream.chunks_played} segments played</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary">{Number(stream.total_paid).toFixed(4)} USDC</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lastPlayed.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
