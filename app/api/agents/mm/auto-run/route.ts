import { type NextRequest, NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Auto-run endpoint that checks all active MM agents and runs cycles if needed
 * This should be called by a cron job every minute
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all active MM agents
    const { data: agents, error } = await supabase.from("mm_agents").select("*").eq("is_active", true)

    if (error) {
      console.error("[MM Auto-Run] Failed to get active agents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({ message: "No active agents" })
    }

    const results = []

    // Run cycle for each active agent
    for (const agent of agents) {
      try {
        const mmService = new MarketMakerAgentService(agent.id)
        const result = await mmService.runCycle()
        results.push({
          agentId: agent.id,
          walletAddress: agent.wallet_address,
          ...result,
        })
      } catch (error: any) {
        console.error(`[MM Auto-Run] Error running cycle for agent ${agent.id}:`, error)
        results.push({
          agentId: agent.id,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: agents.length,
      results,
    })
  } catch (error: any) {
    console.error("[MM Auto-Run] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
