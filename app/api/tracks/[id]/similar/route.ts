import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  const { data: sourceTrack } = await supabase.from("tracks").select("ai_style, artist_id").eq("id", id).single()

  if (!sourceTrack) {
    return NextResponse.json([])
  }

  let query = supabase
    .from("tracks")
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(
        artist_name,
        avatar_url,
        wallet_address
      )
    `)
    .neq("id", id) // Exclude the current track
    .or("is_hidden.is.null,is_hidden.eq.false")
    .limit(20)

  if (sourceTrack.ai_style) {
    query = query.eq("ai_style", sourceTrack.ai_style)
  }

  const { data: similarTracks } = await query

  if (!similarTracks || similarTracks.length === 0) {
    const { data: artistTracks } = await supabase
      .from("tracks")
      .select(`
        *,
        artist:profiles!tracks_artist_id_fkey(
          artist_name,
          avatar_url,
          wallet_address
        )
      `)
      .eq("artist_id", sourceTrack.artist_id)
      .neq("id", id)
      .or("is_hidden.is.null,is_hidden.eq.false")
      .limit(10)

    return NextResponse.json(artistTracks || [])
  }

  const trackIds = similarTracks.map((t) => t.id)
  const { data: streams } = await supabase.from("streams").select("track_id, chunks_played").in("track_id", trackIds)

  const playCountMap = new Map<string, number>()
  streams?.forEach((stream) => {
    const count = playCountMap.get(stream.track_id) || 0
    playCountMap.set(stream.track_id, count + stream.chunks_played)
  })

  const tracksWithStats = similarTracks.map((track) => ({
    ...track,
    artist_name: track.artist?.artist_name || "Unknown Artist",
    avatar_url: track.artist?.avatar_url,
    play_count: playCountMap.get(track.id) || 0,
  }))

  tracksWithStats.sort((a, b) => b.play_count - a.play_count)

  return NextResponse.json(tracksWithStats.slice(0, 10))
}
