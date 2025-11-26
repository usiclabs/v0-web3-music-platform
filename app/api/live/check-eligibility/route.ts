import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("[v0] === ELIGIBILITY CHECK API CALLED ===")

  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    console.log("[v0] Eligibility check request for address:", address)

    if (!address) {
      console.error("[v0] Eligibility check: Missing address parameter")
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()
    console.log("[v0] Normalized address:", normalizedAddress)

    console.log("[v0] Creating Supabase client...")
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    console.log("[v0] Querying tracks for artist:", normalizedAddress)
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, artist_id")
      .eq("artist_id", normalizedAddress)
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Error checking tracks:", error)
      return NextResponse.json({ error: "Failed to check eligibility" }, { status: 500 })
    }

    console.log("[v0] Query result - tracks found:", tracks?.length || 0)
    if (tracks && tracks.length > 0) {
      console.log(
        "[v0] Sample tracks:",
        tracks.slice(0, 3).map((t) => ({ id: t.id, title: t.title, artist_id: t.artist_id })),
      )
    } else {
      console.log("[v0] No tracks found. Checking if any tracks exist for similar addresses...")
      // Check if there are any tracks with case-insensitive match
      const { data: allTracks } = await supabase
        .from("tracks")
        .select("artist_id")
        .ilike("artist_id", normalizedAddress)
        .limit(5)
      console.log("[v0] Case-insensitive search found:", allTracks?.length || 0, "tracks")
      if (allTracks && allTracks.length > 0) {
        console.log(
          "[v0] Sample artist_ids in database:",
          allTracks.map((t) => t.artist_id),
        )
      }
    }

    const trackCount = tracks?.length || 0
    const isEligible = trackCount >= 3

    console.log("[v0] Eligibility check result:", {
      address: normalizedAddress,
      trackCount,
      isEligible,
      requiredTracks: 3,
    })

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
