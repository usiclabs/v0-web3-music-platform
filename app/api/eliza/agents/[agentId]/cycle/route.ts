import { type NextRequest, NextResponse } from "next/server"
import { ElizaAgentService } from "@/lib/eliza/core"
import { musicPlugin } from "@/lib/eliza/plugins/music-plugin"
import { tradingPlugin } from "@/lib/eliza/plugins/trading-plugin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params

    const service = new ElizaAgentService(agentId)
    await service.initialize()

    // Register plugins
    service.registerPlugin(musicPlugin)
    service.registerPlugin(tradingPlugin)

    // Run cycle
    await service.runCycle()

    // Get stats
    const stats = await service.getStats()

    return NextResponse.json({ success: true, stats })
  } catch (error: any) {
    console.error("[API] Eliza cycle error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
