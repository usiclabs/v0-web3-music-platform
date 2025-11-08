import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeFilter = searchParams.get("time") || "all"

  const supabase = await createClient()

  let timeWindow = new Date(0) // Beginning of time for "all"
  const now = new Date()

  if (timeFilter === "24h") {
    timeWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  } else if (timeFilter === "7d") {
    timeWindow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (timeFilter === "30d") {
    timeWindow = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const { data: streams } = await supabase
    .from("streams")
    .select("track_id, chunks_played, listener_address, last_played_at, total_paid")
    .gte("last_played_at", timeWindow.toISOString())
    .order("last_played_at", { ascending: false })

  if (!streams || streams.length === 0) {
    return NextResponse.json([])
  }

  const trackStats = new Map<string, { plays: number; listeners: Set<string>; earnings: number }>()

  for (const stream of streams) {
    const existing = trackStats.get(stream.track_id) || { plays: 0, listeners: new Set(), earnings: 0 }
    existing.plays += stream.chunks_played
    existing.listeners.add(stream.listener_address)
    existing.earnings += Number(stream.total_paid) || 0
    trackStats.set(stream.track_id, existing)
  }

  const topTrackIds = Array.from(trackStats.entries())
    .sort((a, b) => b[1].plays - a[1].plays)
    .slice(0, 50)
    .map(([trackId]) => trackId)

  if (topTrackIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: tracks } = await supabase
    .from("tracks")
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(
        artist_name,
        avatar_url,
        wallet_address
      )
    `)
    .in("id", topTrackIds)
    .or("is_hidden.is.null,is_hidden.eq.false")

  if (!tracks) {
    return NextResponse.json([])
  }

  const tracksWithStats = tracks.map((track) => {
    const stats = trackStats.get(track.id)!
    return {
      ...track,
      artist_name: track.artist?.artist_name || "Unknown Artist",
      avatar_url: track.artist?.avatar_url,
      total_plays: stats.plays,
      total_listeners: stats.listeners.size,
      total_earnings: stats.earnings,
    }
  })

  tracksWithStats.sort((a, b) => {
    const aIndex = topTrackIds.indexOf(a.id)
    const bIndex = topTrackIds.indexOf(b.id)
    return aIndex - bIndex
  })

  return NextResponse.json(tracksWithStats)
}
