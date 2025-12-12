import { type NextRequest, NextResponse } from "next/server"
import { AutoStreamAgentService } from "@/lib/agents/auto-stream-agent"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const stats = await AutoStreamAgentService.getStats(agentId)

    return NextResponse.json({ stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
