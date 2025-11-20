import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get total tracks created
    const { count: tracksCount } = await supabase.from("tracks").select("*", { count: "exact", head: true })

    // Get unique artists by counting distinct artist_ids from tracks table
    const { data: uniqueArtistsData } = await supabase.from("tracks").select("artist_id")

    // Count unique artist_ids
    const uniqueArtists = new Set(uniqueArtistsData?.map((t) => t.artist_id) || []).size

    return NextResponse.json({
      tracksCreated: tracksCount || 0,
      artists: uniqueArtists,
      maxDuration: 8, // Static value - Suno v5 max duration
    })
  } catch (error) {
    console.error("[v0] Error fetching platform stats:", error)
    // Return fallback data on error
    return NextResponse.json({
      tracksCreated: 0,
      artists: 0,
      maxDuration: 8,
    })
  }
}
