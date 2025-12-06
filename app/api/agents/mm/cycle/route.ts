import { NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const { agentId, action } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    console.log(`[API] Running MM agent ${action || "cycle"} for ${agentId}`)

    const mmAgent = new MarketMakerAgentService(agentId)

    let result
    if (action === "buy") {
      // Execute only buy
      result = await mmAgent.runCycle(true, false)
    } else if (action === "sell") {
      // Execute only sell
      result = await mmAgent.runCycle(false, true)
    } else {
      // Execute full cycle (both buy and sell)
      result = await mmAgent.runCycle()
    }

    return NextResponse.json({
      success: true,
      buyExecuted: result.buyExecuted,
      sellExecuted: result.sellExecuted,
      messages: result.messages,
    })
  } catch (error: any) {
    console.error("[API] MM agent cycle error:", error)
    return NextResponse.json({ error: error.message || "Failed to run MM cycle" }, { status: 500 })
  }
}
