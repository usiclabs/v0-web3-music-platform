import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const type = searchParams.get("type") // 'tracks', 'artists', 'playlists', or 'all'
  const limit = Number.parseInt(searchParams.get("limit") || "20")

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 })
  }

  const supabase = createServerClient()

  const results: {
    tracks: any[]
    artists: any[]
    playlists: any[]
  } = {
    tracks: [],
    artists: [],
    playlists: [],
  }

  try {
    // Search tracks
    if (type === "all" || type === "tracks") {
      const { data: tracks } = await supabase
        .from("tracks")
        .select(
          `
          *,
          artist:profiles!tracks_artist_id_fkey(*)
        `,
        )
        .or(`title.ilike.%${query}%,ai_style.ilike.%${query}%`)
        .eq("is_active", true)
        .or("is_hidden.is.null,is_hidden.eq.false")
        .limit(limit)
        .order("created_at", { ascending: false })

      results.tracks = tracks || []
    }

    // Search artists
    if (type === "all" || type === "artists") {
      const { data: artists } = await supabase
        .from("profiles")
        .select("*")
        .or(`artist_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .not("artist_name", "is", null)
        .limit(limit)

      results.artists = artists || []
    }

    // Search playlists
    if (type === "all" || type === "playlists") {
      const { data: playlists } = await supabase
        .from("playlists")
        .select(
          `
          *,
          owner:profiles!playlists_owner_address_fkey(*),
          tracks:playlist_tracks(count)
        `,
        )
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("is_public", true)
        .limit(limit)
        .order("created_at", { ascending: false })

      results.playlists = playlists || []
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
