import { NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const mmAgent = new MarketMakerAgentService(agentId)
    const stats = await mmAgent.getStats()

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error("[API] Failed to get MM stats:", error)
    return NextResponse.json({ error: error.message || "Failed to get stats" }, { status: 500 })
  }
}
