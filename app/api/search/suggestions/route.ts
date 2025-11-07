import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  const supabase = createServerClient()

  try {
    // Get popular track titles and artist names that match
    const { data: tracks } = await supabase
      .from("tracks")
      .select("title, artist:profiles!tracks_artist_id_fkey(artist_name)")
      .or(`title.ilike.%${query}%`)
      .eq("is_active", true)
      .or("is_hidden.is.null,is_hidden.eq.false")
      .limit(5)

    const { data: artists } = await supabase
      .from("profiles")
      .select("artist_name")
      .ilike("artist_name", `%${query}%`)
      .not("artist_name", "is", null)
      .limit(5)

    const suggestions = [
      ...(tracks?.map((t) => ({ text: t.title, type: "track" })) || []),
      ...(artists?.map((a) => ({ text: a.artist_name, type: "artist" })) || []),
    ]

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Suggestions error:", error)
    return NextResponse.json([])
  }
}
