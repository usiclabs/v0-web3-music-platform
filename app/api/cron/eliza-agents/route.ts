import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * Cron endpoint for Eliza agent auto-execution
 * Runs every 5 minutes to execute agent cycles
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null

    // In production with CRON_SECRET set, verify authorization
    if (expectedAuth && authHeader !== expectedAuth) {
      console.error("[Cron] Unauthorized request to Eliza agent cron")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron] Running Eliza agent auto-execution...")

    // Call the auto-run endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"
    const response = await fetch(`${baseUrl}/api/eliza/agents/auto-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    console.log(`[Cron] Eliza agent execution completed: ${data.processed || 0} agents processed`)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Cron] Eliza Agent error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
