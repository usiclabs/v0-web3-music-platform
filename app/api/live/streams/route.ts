import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("[v0] === STREAMS API ROUTE CALLED ===")

  try {
    const { searchParams } = new URL(request.url)
    const liveOnly = searchParams.get("live") === "true"

    console.log("[v0] Fetching streams, liveOnly:", liveOnly)

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    let query = supabase
      .from("live_streams")
      .select(`
        id,
        title,
        description,
        is_live,
        viewer_count,
        playback_id,
        artist_address,
        started_at,
        ended_at,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (liveOnly) {
      query = query.eq("is_live", true)
    }

    console.log("[v0] Executing query...")
    const { data: streams, error } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch streams", details: error.message }, { status: 500 })
    }

    console.log("[v0] Query successful, found", streams?.length || 0, "streams")

    if (!streams || streams.length === 0) {
      console.log("[v0] No streams found, returning empty array")
      return NextResponse.json([])
    }

    const artistAddresses = [...new Set(streams.map((s) => s.artist_address))]
    console.log("[v0] Fetching profiles for", artistAddresses.length, "artists")

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("wallet_address, artist_name, avatar_url")
      .in("wallet_address", artistAddresses)

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
      // Continue without profiles rather than failing
    }

    const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

    const streamsWithArtists = streams.map((stream) => ({
      ...stream,
      artist: profileMap.get(stream.artist_address) || {
        wallet_address: stream.artist_address,
        artist_name: null,
        avatar_url: null,
      },
    }))

    console.log("[v0] Returning", streamsWithArtists.length, "streams with artist data")
    return NextResponse.json(streamsWithArtists)
  } catch (error) {
    console.error("[v0] Unexpected error in streams route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
