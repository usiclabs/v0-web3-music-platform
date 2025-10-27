import { createServerClient } from "@/lib/supabase/server"
import { TrendingFeed } from "@/components/trending-feed"
import type { Track } from "@/types/database"

interface TrendingTrack extends Track {
  artist_name: string
  avatar_url: string | null
  total_plays: number
  total_listeners: number
}

export default async function TrendingPage() {
  const supabase = await createServerClient()

  const { data: streamData } = await supabase
    .from("streams")
    .select(
      `
      track_id,
      chunks_played,
      listener_address,
      tracks!inner (
        id,
        title,
        artist_id,
        cover_url,
        audio_url,
        duration,
        price_per_chunk,
        created_at
      )
    `,
    )
    .order("chunks_played", { ascending: false })
    .limit(100) // Get top 100 streams to aggregate

  // Get unique artist IDs to fetch profiles
  const artistIds = streamData ? [...new Set(streamData.map((s: any) => s.tracks.artist_id))] : []

  // Fetch artist profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("wallet_address, artist_name, avatar_url")
    .in("wallet_address", artistIds)

  // Create a map of artist profiles
  const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

  // Aggregate by track_id to get total plays and unique listeners
  const trackMap = new Map<string, TrendingTrack>()

  if (streamData) {
    for (const stream of streamData) {
      const track = stream.tracks as any
      const profile = profileMap.get(track.artist_id)

      if (!trackMap.has(track.id)) {
        trackMap.set(track.id, {
          ...track,
          artist_name: profile?.artist_name || "Unknown Artist",
          avatar_url: profile?.avatar_url || null,
          total_plays: 0,
          total_listeners: new Set(),
        } as any)
      }

      const existing = trackMap.get(track.id)!
      existing.total_plays += stream.chunks_played || 1
      ;(existing as any).total_listeners.add(stream.listener_address)
    }
  }

  // Convert Set to count and sort by total plays
  const tracks = Array.from(trackMap.values())
    .map((track) => ({
      ...track,
      total_listeners: track.total_listeners.size,
    }))
    .sort((a, b) => b.total_plays - a.total_plays)
    .slice(0, 20) // Top 20 trending tracks

  return <TrendingFeed tracks={tracks} />
}
