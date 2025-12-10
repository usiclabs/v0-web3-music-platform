import { type NextRequest, NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Auto-run endpoint that checks all active MM agents and runs cycles if needed
 * This is called by the cron job every minute
 *
 * For each active agent, it checks if enough time has passed since the last
 * buy/sell and executes the appropriate action based on the configured intervals.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [MM Auto-Run] ========== Auto-run triggered ==========")

    const supabase = await createClient()

    // Get all active MM agents
    const { data: agents, error } = await supabase.from("mm_agents").select("*").eq("is_active", true)

    if (error) {
      console.error("[MM Auto-Run] Failed to get active agents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
      console.log("[MM Auto-Run] No active agents found")
      return NextResponse.json({ message: "No active agents", processed: 0 })
    }

    console.log(`[v0] [MM Auto-Run] Found ${agents.length} active agent(s):`)
    agents.forEach((agent) => {
      console.log(
        `[v0]   - Agent ${agent.id}: token=${agent.token_symbol || "USI"} (${agent.token_address || "default"}), owner=${agent.owner_address}`,
      )
    })

    console.log(`[MM Auto-Run] Processing ${agents.length} active agent(s)`)

    const results = []

    // Run cycle for each active agent
    for (const agent of agents) {
      try {
        const now = new Date()
        const lastBuy = agent.last_buy_at ? new Date(agent.last_buy_at) : null
        const lastSell = agent.last_sell_at ? new Date(agent.last_sell_at) : null

        const buyIntervalMs = (agent.buy_interval_minutes || 5) * 60 * 1000
        const sellIntervalMs = (agent.sell_interval_minutes || 10) * 60 * 1000

        const shouldBuy = !lastBuy || now.getTime() - lastBuy.getTime() >= buyIntervalMs
        const shouldSell = !lastSell || now.getTime() - lastSell.getTime() >= sellIntervalMs

        if (shouldBuy || shouldSell) {
          console.log(`[v0] [MM Auto-Run] ✓ Running cycle for agent ${agent.id}`)
          console.log(`[v0]   Token: ${agent.token_symbol || "USI"} (${agent.token_address || "default"})`)
          console.log(`[v0]   Should buy: ${shouldBuy}, Should sell: ${shouldSell}`)

          console.log(`[MM Auto-Run] Running cycle for agent ${agent.id} (buy: ${shouldBuy}, sell: ${shouldSell})`)

          const mmService = new MarketMakerAgentService(agent.id)
          const result = await mmService.runCycle()

          results.push({
            agentId: agent.id,
            owner: agent.owner_address,
            executed: true,
            ...result,
          })
        } else {
          console.log(`[v0] [MM Auto-Run] ✗ Skipping agent ${agent.id} - intervals not met`)
          console.log(`[v0]   Last buy: ${agent.last_buy_at}, interval: ${agent.buy_interval_minutes}m`)
          console.log(`[v0]   Last sell: ${agent.last_sell_at}, interval: ${agent.sell_interval_minutes}m`)

          console.log(`[MM Auto-Run] Skipping agent ${agent.id} - intervals not met`)
          results.push({
            agentId: agent.id,
            owner: agent.owner_address,
            executed: false,
            message: "Intervals not met",
          })
        }
      } catch (error) {
        console.error(`[MM Auto-Run] Error running cycle for agent ${agent.id}:`, error)
        console.error(`[v0] [MM Auto-Run] Error stack:`, error.stack)

        results.push({
          agentId: agent.id,
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
  } catch (error) {
    console.error("[MM Auto-Run] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
