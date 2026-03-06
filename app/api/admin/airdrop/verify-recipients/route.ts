import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("[v0] === AIRDROP RECIPIENT VERIFICATION STARTED ===")

  try {
    const supabase = await createClient()

    // Fetch all eligible airdrop recipients
    const { data: profiles } = await supabase.from("profiles").select("wallet_address, created_at")

    const results = {
      total_checked: 0,
      eligible: 0,
      ineligible: 0,
      reasons: [] as Array<{
        wallet: string
        reason: string
        details: Record<string, unknown>
      }>,
    }

    for (const profile of profiles || []) {
      const userAddress = profile.wallet_address.toLowerCase()
      results.total_checked++

      const { data: streams } = await supabase.from("streams").select("id").eq("listener_address", userAddress)

      const { data: uploads } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", userAddress)
        .eq("is_active", true)

      const streamCount = streams?.length || 0
      const uploadCount = uploads?.length || 0
      const isEligible = streamCount >= 20 || uploadCount >= 1

      if (isEligible) {
        results.eligible++
      } else {
        results.ineligible++
        results.reasons.push({
          wallet: userAddress,
          reason: "Does not meet minimum eligibility criteria",
          details: {
            streams: streamCount,
            uploads: uploadCount,
            required_streams_or_uploads: "20 streams OR 1 upload",
          },
        })
      }
    }

    console.log(`[v0] Verification complete: ${results.eligible} eligible, ${results.ineligible} ineligible`)

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in recipient verification:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
