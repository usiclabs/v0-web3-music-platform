import { type NextRequest, NextResponse } from "next/server"
import { dispersPendingRewards } from "@/lib/stream-to-earn/dispersal-service"

// This endpoint is called by Vercel Cron to automatically disperse pending rewards
export async function GET(request: NextRequest) {
  try {
    // Verify this is called from Vercel Cron by checking the Cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow both with and without secret for flexibility (Vercel provides secret via header)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized cron request - invalid secret")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] ===== STARTING STREAM-TO-EARN DISPERSAL CRON JOB =====")

    const result = await dispersPendingRewards()

    const responseData = {
      timestamp: new Date().toISOString(),
      result,
    }

    console.log("[v0] Cron job completed:", responseData)

    return NextResponse.json(responseData, {
      status: result.success ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json(
      {
        error: "Cron job failed",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
