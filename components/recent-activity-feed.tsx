"use client"

import { Card } from "@/components/ui/card"
import { Activity, Play, DollarSign, Music } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface RecentActivityFeedProps {
  activity: Array<{
    id: string
    started_at: string
    listener_address: string
    chunks_played: number
    total_paid: number
    tracks: {
      id: string
      title: string
      cover_url: string | null
      profiles: {
        artist_name: string | null
      } | null
    } | null
  }>
}

export function RecentActivityFeed({ activity: initialActivity }: RecentActivityFeedProps) {
  const [activity, setActivity] = useState(initialActivity)
  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] Setting up real-time activity feed subscription...")

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "streams",
        },
        async (payload) => {
          console.log("[v0] New stream activity received:", payload)

          const newStream = payload.new as {
            id: string
            started_at: string
            listener_address: string
            chunks_played: number
            total_paid: number
            track_id: string
          }

          const { data: streamData } = await supabase
            .from("streams")
            .select(
              `
              id,
              started_at,
              listener_address,
              chunks_played,
              total_paid,
              tracks!streams_track_id_fkey (
                id,
                title,
                cover_url,
                artist_id,
                profiles!tracks_artist_id_fkey (
                  artist_name
                )
              )
            `,
            )
            .eq("id", newStream.id)
            .single()

          if (streamData) {
            console.log("[v0] Adding new activity to feed:", streamData)
            setActivity((prev) => [streamData, ...prev].slice(0, 20))
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Activity feed subscription status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up activity feed subscription")
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        Recent Activity
        <span className="ml-auto flex items-center gap-1 text-xs text-green-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </span>
      </h3>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No activity yet</div>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {item.tracks?.cover_url ? (
                  <Image
                    src={item.tracks.cover_url || "/placeholder.svg"}
                    alt={item.tracks.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm">
                  <span className="font-mono text-primary">
                    {item.listener_address.slice(0, 6)}...{item.listener_address.slice(-4)}
                  </span>
                  <span className="text-muted-foreground"> played </span>
                  {item.tracks ? (
                    <Link
                      href={`/track/${item.tracks.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {item.tracks.title}
                    </Link>
                  ) : (
                    <span className="font-medium">Unknown Track</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <Play className="h-3 w-3" />
                  {item.chunks_played}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  {Number(item.total_paid).toFixed(3)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
