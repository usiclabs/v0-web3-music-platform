import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userAddress = searchParams.get("userAddress")

  if (!userAddress) {
    return NextResponse.json({ error: "User address required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: streams } = await supabase
    .from("streams")
    .select(`
      id,
      track_id,
      last_played_at,
      tracks!inner (
        *,
        artist:profiles!tracks_artist_id_fkey(
          artist_name,
          avatar_url
        )
      )
    `)
    .eq("listener_address", userAddress.toLowerCase())
    .order("last_played_at", { ascending: false })
    .limit(10)

  return NextResponse.json(streams || [])
}
