import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: artists } = await supabase.from("profiles").select("*").not("artist_name", "is", null).limit(100)

  if (!artists || artists.length === 0) {
    return NextResponse.json([])
  }

  const artistAddresses = artists.map((a) => a.wallet_address)

  const { data: tracks } = await supabase
    .from("tracks")
    .select("artist_id")
    .in("artist_id", artistAddresses)
    .or("is_hidden.is.null,is_hidden.eq.false")

  const trackCountMap = new Map<string, number>()
  tracks?.forEach((track) => {
    const count = trackCountMap.get(track.artist_id) || 0
    trackCountMap.set(track.artist_id, count + 1)
  })

  const { data: follows } = await supabase
    .from("follows")
    .select("following_address")
    .in("following_address", artistAddresses)

  const followerCountMap = new Map<string, number>()
  follows?.forEach((follow) => {
    const count = followerCountMap.get(follow.following_address) || 0
    followerCountMap.set(follow.following_address, count + 1)
  })

  const trackIds = tracks?.map((t) => t.artist_id) || []
  const { data: trackList } = await supabase.from("tracks").select("id, artist_id").in("artist_id", artistAddresses)

  const artistTrackMap = new Map<string, string[]>()
  trackList?.forEach((track) => {
    const existing = artistTrackMap.get(track.artist_id) || []
    existing.push(track.id)
    artistTrackMap.set(track.artist_id, existing)
  })

  const playCountMap = new Map<string, number>()
  for (const [artistId, trackIds] of artistTrackMap.entries()) {
    const { data: streams } = await supabase.from("streams").select("chunks_played").in("track_id", trackIds)

    const totalPlays = streams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
    playCountMap.set(artistId, totalPlays)
  }

  const artistsWithStats = artists.map((artist) => ({
    ...artist,
    trackCount: trackCountMap.get(artist.wallet_address) || 0,
    followerCount: followerCountMap.get(artist.wallet_address) || 0,
    playCount: playCountMap.get(artist.wallet_address) || 0,
  }))

  artistsWithStats.forEach((artist: any) => {
    artist.score = artist.playCount * 2 + artist.followerCount * 10 + artist.trackCount * 5
  })

  artistsWithStats.sort((a: any, b: any) => b.score - a.score)

  return NextResponse.json(artistsWithStats.slice(0, 20))
}
