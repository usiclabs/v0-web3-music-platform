import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkTrackSession } from "@/lib/x402/session"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")
    const trackId = searchParams.get("trackId")

    if (!address || !trackId) {
      return NextResponse.json({ error: "Missing address or trackId" }, { status: 400 })
    }

    // Check session-based ownership first (faster)
    const hasSession = await checkTrackSession(address, trackId)

    if (hasSession) {
      console.log("[v0] User owns track via session:", address, trackId)
      return NextResponse.json({ owns: true, trackId, address, source: "session" })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("streams")
      .select("id")
      .eq("listener_address", address.toLowerCase())
      .eq("track_id", trackId)
      .limit(1)

    if (error) {
      console.error("[v0] Failed to check ownership:", error)
      return NextResponse.json({ owns: false }, { status: 200 })
    }

    const owns = data && data.length > 0

    if (owns) {
      console.log("[v0] User owns track via payment history:", address, trackId)
    }

    return NextResponse.json({ owns, trackId, address, source: owns ? "payment" : "none" })
  } catch (error) {
    console.error("[v0] Ownership check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
