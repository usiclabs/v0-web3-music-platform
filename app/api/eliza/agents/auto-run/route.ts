import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ElizaAgentService } from "@/lib/eliza/core"
import { musicPlugin } from "@/lib/eliza/plugins/music-plugin"
import { tradingPlugin } from "@/lib/eliza/plugins/trading-plugin"

export const dynamic = "force-dynamic"

/**
 * Auto-run endpoint for all active Eliza agents
 * Called by cron job every 5 minutes
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Eliza Auto-Run] Starting agent cycle execution")

    const supabase = await createClient()

    // Get all active agents
    const { data: agents, error } = await supabase.from("eliza_agents").select("*").eq("is_active", true)

    if (error) {
      console.error("[Eliza Auto-Run] Failed to get active agents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
      console.log("[Eliza Auto-Run] No active agents found")
      return NextResponse.json({ message: "No active agents", processed: 0 })
    }

    console.log(`[Eliza Auto-Run] Found ${agents.length} active agent(s)`)

    const results = []

    // Run cycle for each active agent
    for (const agent of agents) {
      try {
        console.log(`[Eliza Auto-Run] Processing agent ${agent.id} (${agent.name})`)

        const service = new ElizaAgentService(agent.id)
        await service.initialize()

        // Register plugins
        service.registerPlugin(musicPlugin)
        service.registerPlugin(tradingPlugin)

        // Run cycle
        await service.runCycle()

        // Get stats
        const stats = await service.getStats()

        results.push({
          agentId: agent.id,
          name: agent.name,
          executed: true,
          stats,
        })

        console.log(`[Eliza Auto-Run] Successfully executed cycle for agent ${agent.id}`)
      } catch (error: any) {
        console.error(`[Eliza Auto-Run] Error running cycle for agent ${agent.id}:`, error)
        results.push({
          agentId: agent.id,
          name: agent.name,
          executed: false,
          error: error.message,
        })
      }
    }

    const executedCount = results.filter((r) => r.executed).length

    return NextResponse.json({
      success: true,
      processed: agents.length,
      executed: executedCount,
      results,
    })
  } catch (error: any) {
    console.error("[Eliza Auto-Run] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
