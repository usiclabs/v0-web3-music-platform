import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { InvestmentAgent } from "@/lib/agents/investment-agent"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all active investment agents
    const { data: agents } = await supabase.from("investment_agents").select("*").eq("is_active", true)

    if (!agents || agents.length === 0) {
      return NextResponse.json({ message: "No active agents to run" })
    }

    const results = []
    for (const agent of agents) {
      try {
        const investmentAgent = new InvestmentAgent(agent.id)
        const result = await investmentAgent.runCycle()
        results.push({ agentId: agent.id, success: true, result })
      } catch (error: any) {
        console.error(`[v0] Error running cycle for agent ${agent.id}:`, error.message)
        results.push({ agentId: agent.id, success: false, error: error.message })
      }
    }

    return NextResponse.json({ message: "Cron cycle complete", results })
  } catch (error: any) {
    console.error("[v0] Cron error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
