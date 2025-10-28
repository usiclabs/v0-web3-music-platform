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
        *,
        artist:profiles!live_streams_artist_address_fkey(*)
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

    return NextResponse.json(streams || [])
  } catch (error) {
    console.error("[v0] Error in streams route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
