import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const liveOnly = searchParams.get("live") === "true"

    console.log("[v0] Fetching live streams, liveOnly:", liveOnly)

    let query = supabase
      .from("live_streams")
      .select(`
        id,
        title,
        description,
        is_live,
        viewer_count,
        playback_id,
        stream_key,
        artist_address,
        started_at,
        ended_at,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (liveOnly) {
      query = query.eq("is_live", true)
    }

    const { data: streams, error } = await query

    if (error) {
      console.error("[v0] Error fetching streams:", error)
      return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 })
    }

    console.log("[v0] Found streams:", streams?.length || 0)

    if (streams && streams.length > 0) {
      const artistAddresses = [...new Set(streams.map((s) => s.artist_address))]

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("wallet_address, artist_name, avatar_url")
        .in("wallet_address", artistAddresses)

      if (profilesError) {
        console.error("[v0] Error fetching profiles:", profilesError)
      }

      // Map profiles to streams
      const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

      const streamsWithArtists = streams.map((stream) => ({
        ...stream,
        artist: profileMap.get(stream.artist_address) || {
          wallet_address: stream.artist_address,
          artist_name: null,
          avatar_url: null,
        },
      }))

      console.log("[v0] Streams with artists:", streamsWithArtists.length)
      return NextResponse.json(streamsWithArtists)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("[v0] Error in streams route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
