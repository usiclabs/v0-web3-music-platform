import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/following - Get tracks from artists the user follows
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("address")

    console.log("[v0] Following API called")
    console.log("[v0] User address:", userAddress)

    if (!userAddress) {
      return NextResponse.json({ error: "User address required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const normalizedAddress = userAddress.toLowerCase()
    console.log("[v0] Normalized address:", normalizedAddress)

    // Get list of artists the user follows
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_address")
      .ilike("follower_address", normalizedAddress)

    console.log("[v0] Follows query result:", { follows, error: followsError })

    if (followsError) {
      console.error("[v0] Error fetching follows:", followsError)
      return NextResponse.json({ error: "Failed to fetch follows" }, { status: 500 })
    }

    // If user doesn't follow anyone, return empty array
    if (!follows || follows.length === 0) {
      console.log("[v0] User is not following anyone")
      return NextResponse.json({ tracks: [] })
    }

    const followedArtists = follows.map((f) => f.following_address.toLowerCase())
    console.log("[v0] Following artists:", followedArtists)

    // Get tracks from followed artists - use OR conditions for case-insensitive matching
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select(
        `
        *,
        artist:profiles!tracks_artist_id_fkey(*)
      `,
      )
      .or(followedArtists.map((addr) => `artist_id.ilike.${addr}`).join(","))
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100)

    console.log("[v0] Tracks query result:", { trackCount: tracks?.length, error: tracksError })

    if (tracksError) {
      console.error("[v0] Error fetching tracks:", tracksError)
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
    }

    // Get play counts and likes for these tracks
    const trackIds = tracks?.map((t) => t.id) || []

    const [{ data: streams }, { data: likes }] = await Promise.all([
      supabase.from("streams").select("track_id, chunks_played, total_paid").in("track_id", trackIds),
      supabase.from("likes").select("track_id").in("track_id", trackIds),
    ])

    // Aggregate stats
    const statsMap = new Map<string, { total_earned: number; play_count: number; like_count: number }>()

    trackIds.forEach((id) => {
      statsMap.set(id, { total_earned: 0, play_count: 0, like_count: 0 })
    })

    streams?.forEach((stream) => {
      const stats = statsMap.get(stream.track_id)!
      stats.total_earned += Number(stream.total_paid)
      stats.play_count += stream.chunks_played
    })

    likes?.forEach((like) => {
      const stats = statsMap.get(like.track_id)!
      stats.like_count += 1
    })

    // Merge stats with tracks
    const tracksWithStats = tracks?.map((track) => ({
      ...track,
      ...statsMap.get(track.id),
    }))

    console.log("[v0] Returning tracks with stats:", tracksWithStats?.length)

    return NextResponse.json({ tracks: tracksWithStats || [] })
  } catch (error) {
    console.error("[v0] Following feed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
