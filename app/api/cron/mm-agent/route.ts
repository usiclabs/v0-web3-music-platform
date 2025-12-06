import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * Cron endpoint for MM agent auto-execution
 * Add this to Vercel Cron Jobs to run every minute:
 * https://vercel.com/docs/cron-jobs
 *
 * In vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/mm-agent",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the auto-run endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"
    const response = await fetch(`${baseUrl}/api/agents/mm/auto-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Cron] MM Agent error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
