import { type NextRequest, NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"

export async function POST(req: NextRequest) {
  try {
    const { agentId, numWallets } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    await MarketMakerAgentService.setupMultiWallet(agentId, numWallets || 5)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API] Failed to setup multi-wallet:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
