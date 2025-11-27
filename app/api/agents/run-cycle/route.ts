import { type NextRequest, NextResponse } from "next/server"
import { runAgentCycle } from "@/lib/agents/strategy-engine"

/**
 * POST /api/agents/run-cycle
 * Manually trigger an agent scan cycle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const results = await runAgentCycle(agentId)

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("[Agent Run Cycle API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
