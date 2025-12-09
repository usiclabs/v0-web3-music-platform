import { type NextRequest, NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"

export async function POST(request: NextRequest) {
  try {
    const { agentId, ownerAddress } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    console.log(`[API] Executing burst mode for agent ${agentId}`)

    const service = new MarketMakerAgentService(agentId, ownerAddress)
    const result = await service.executeBurst()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[API] Burst mode failed:", error.message)
    return NextResponse.json({ error: error.message || "Burst mode execution failed" }, { status: 500 })
  }
}
