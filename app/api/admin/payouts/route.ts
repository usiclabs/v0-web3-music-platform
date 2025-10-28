import { NextResponse } from "next/server"
import { processArtistPayouts } from "@/lib/cdp/payouts"
import { isCDPConfigured } from "@/lib/cdp/client"

/**
 * Admin endpoint to trigger artist payouts
 * POST /api/admin/payouts
 *
 * This should be protected with admin authentication in production
 * and/or called via a cron job
 */
export async function POST() {
  try {
    // Check if CDP is configured
    if (!isCDPConfigured()) {
      return NextResponse.json(
        {
          error: "CDP not configured. Please set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables.",
        },
        { status: 500 },
      )
    }

    console.log("[API] Starting artist payout process...")

    const result = await processArtistPayouts()

    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.success + result.failed} payouts. ${result.success} successful, ${result.failed} failed. Total: $${result.totalAmount}`,
    })
  } catch (error) {
    console.error("[API] Payout processing failed:", error)
    return NextResponse.json(
      {
        error: "Failed to process payouts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

/**
 * Get payout status and statistics
 * GET /api/admin/payouts
 */
export async function GET() {
  try {
    const configured = isCDPConfigured()

    return NextResponse.json({
      cdpConfigured: configured,
      message: configured
        ? "CDP is configured and ready for payouts"
        : "CDP not configured. Set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY to enable automated payouts.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check payout status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
