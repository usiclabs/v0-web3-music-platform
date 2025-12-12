import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AutoStreamAgentService } from "@/lib/agents/auto-stream-agent"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: agents } = await supabase.from("auto_stream_agents").select("*").eq("is_active", true)

    if (!agents || agents.length === 0) {
      return NextResponse.json({ message: "No active agents" })
    }

    const results = []

    for (const agent of agents) {
      try {
        const service = new AutoStreamAgentService(agent.id, agent.owner_address)
        const result = await service.runCycle()
        results.push({ agentId: agent.id, result })
      } catch (error: any) {
        results.push({ agentId: agent.id, error: error.message })
      }
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
