import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Broadcast earnings event for real-time notifications
export async function POST(request: NextRequest) {
  try {
    const { artistAddress, amount, trackId, trackTitle } = await request.json()

    if (!artistAddress || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get artist name if available
    const { data: artist } = await supabase
      .from("artists")
      .select("display_name")
      .eq("wallet_address", artistAddress)
      .maybeSingle()

    // Insert earnings event for real-time broadcast
    const { error } = await supabase.from("earnings_events").insert({
      artist_address: artistAddress,
      artist_name: artist?.display_name || null,
      amount,
      track_id: trackId || null,
      track_title: trackTitle || null,
    })

    if (error) {
      console.error("[v0] Failed to broadcast earnings event:", error)
      return NextResponse.json({ error: "Failed to broadcast event" }, { status: 500 })
    }

    console.log("[v0] Earnings event broadcasted:", { artistAddress, amount })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Earnings broadcast error:", error)
    return NextResponse.json({ error: "Failed to broadcast earnings" }, { status: 500 })
  }
}
