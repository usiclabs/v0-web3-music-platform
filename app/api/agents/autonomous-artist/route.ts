import { type NextRequest, NextResponse } from "next/server"
import { AutonomousArtistAgentService } from "@/lib/agents/autonomous-artist-agent"

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("id")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const stats = await AutonomousArtistAgentService.getStats(agentId)
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, agentId, ownerAddress, config } = body

    if (action === "create") {
      // Create new autonomous artist agent
      const agent = await AutonomousArtistAgentService.getOrCreateByOwner(ownerAddress, config)
      return NextResponse.json({ success: true, agent })
    } else if (action === "run-cycle") {
      // Run generation cycle
      const service = new AutonomousArtistAgentService(agentId, ownerAddress)
      const result = await service.runCycle()
      return NextResponse.json({ success: true, ...result })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[Autonomous Artist API]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
