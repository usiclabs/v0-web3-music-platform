import { type NextRequest, NextResponse } from "next/server"
import { AutoStreamAgentService } from "@/lib/agents/auto-stream-agent"

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const service = new AutoStreamAgentService(agentId)
    const result = await service.runCycle()

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error("[API] Failed to run auto-stream cycle:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
