import { type NextRequest, NextResponse } from "next/server"
import { dispersPendingRewards } from "@/lib/stream-to-earn/dispersal-service"

export async function POST(request: NextRequest) {
  try {
    // Verify this is called from an authorized source (cron job or admin)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized dispersal request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting scheduled reward dispersal...")

    const result = await dispersPendingRewards()

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error("[v0] Dispersal endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        rewardsProcessed: 0,
        totalAmount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
