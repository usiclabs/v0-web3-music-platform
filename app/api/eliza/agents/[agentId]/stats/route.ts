import { type NextRequest, NextResponse } from "next/server"
import { ElizaAgentService } from "@/lib/eliza/core"

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params

    const service = new ElizaAgentService(agentId)
    await service.initialize()

    const stats = await service.getStats()

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error("[API] Failed to get agent stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
