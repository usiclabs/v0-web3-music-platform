import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      console.error("[v0] Eligibility check: Missing address parameter")
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    console.log("[v0] Checking live stream eligibility for:", address)

    const supabase = await createClient()

    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id")
      .eq("artist_id", address.toLowerCase())
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Error checking tracks:", error)
      return NextResponse.json({ error: "Failed to check eligibility" }, { status: 500 })
    }

    const trackCount = tracks?.length || 0
    const isEligible = trackCount >= 3

    console.log("[v0] Eligibility check result:", { address, trackCount, isEligible })

    return NextResponse.json({
      eligible: isEligible,
      trackCount,
      requiredTracks: 3,
    })
  } catch (error) {
    console.error("[v0] Error in eligibility check:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
