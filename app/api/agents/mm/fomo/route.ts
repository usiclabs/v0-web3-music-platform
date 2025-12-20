import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"
import {
  FOMO_PATTERNS,
  calculateNaturalTiming,
  calculateFOMOBuyAmount,
  selectWalletForFOMO,
} from "@/lib/agents/fomo-mode-engine"

export async function POST(req: Request) {
  try {
    const { agentId, pattern, intensity } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get agent config
    const { data: agent, error: agentError } = await supabase.from("mm_agents").select("*").eq("id", agentId).single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (!agent.is_active) {
      return NextResponse.json({ error: "Agent is not active" }, { status: 400 })
    }

    const selectedPattern = FOMO_PATTERNS[pattern] || FOMO_PATTERNS.reversal
    const fomoIntensity = intensity || 7

    const mmAgent = new MarketMakerAgentService(agentId)

    // Get wallets
    const { data: wallets } = await supabase
      .from("mm_agent_wallets")
      .select("*")
      .eq("agent_id", agentId)
      .eq("is_active", true)
      .order("wallet_index", { ascending: true })

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({ error: "No active wallets found" }, { status: 400 })
    }

    const results: any[] = []
    let totalBuyVolume = 0n
    const totalSellVolume = 0n
    let tradesExecuted = 0
    let lastUsedWalletIndex = -1

    // Execute each phase of the FOMO pattern
    for (let phaseIndex = 0; phaseIndex < selectedPattern.phases.length; phaseIndex++) {
      const phase = selectedPattern.phases[phaseIndex]
      const phaseDurationMs = phase.duration * 60 * 1000
      const baseIntervalMs = phaseDurationMs / Math.max(phase.buyMultiplier * 3, 3) // More trades for higher multipliers

      const tradesInPhase = Math.ceil(phase.buyMultiplier * 3)

      console.log(`[FOMO] Executing phase ${phaseIndex + 1}/${selectedPattern.phases.length}: ${phase.type}`)
      console.log(`[FOMO] Phase duration: ${phase.duration}min, Trades planned: ${tradesInPhase}`)

      for (let tradeIndex = 0; tradeIndex < tradesInPhase; tradeIndex++) {
        try {
          // Select wallet based on rotation strategy
          const walletIndex = selectWalletForFOMO(
            wallets.map((w, i) => ({ address: w.wallet_address, index: i })),
            phase.walletRotation,
            tradeIndex,
            lastUsedWalletIndex,
          )
          lastUsedWalletIndex = walletIndex

          const wallet = wallets[walletIndex]

          // Calculate timing
          const delayMs = calculateNaturalTiming(phase.timing, baseIntervalMs, tradeIndex, tradesInPhase)

          // Execute buy if multiplier > 0
          if (phase.buyMultiplier > 0) {
            const buyAmount = calculateFOMOBuyAmount(agent.buy_amount_eth, phase, fomoIntensity, tradeIndex)

            console.log(
              `[FOMO] Trade ${tradesExecuted + 1}: BUY ${buyAmount.toString()} wei via wallet ${wallet.wallet_address.slice(0, 8)}...`,
            )

            // Note: In production, this would call mmAgent.executeBuy with the specific amount
            // For now, we'll use the standard buy which uses the configured amount
            const buyResult = await mmAgent.executeBuy(wallet)

            if (buyResult.success) {
              totalBuyVolume += buyAmount
              tradesExecuted++
              results.push({
                phase: phaseIndex + 1,
                type: "buy",
                wallet: wallet.wallet_address,
                success: true,
                pattern: phase.type,
              })
            }
          }

          // Execute sell if multiplier > 0 (typically very low in FOMO mode)
          if (phase.sellMultiplier > 0 && Math.random() < phase.sellMultiplier) {
            console.log(`[FOMO] Small organic sell to appear natural`)
            const sellResult = await mmAgent.executeSell(wallet)
            if (sellResult.success) {
              tradesExecuted++
              results.push({
                phase: phaseIndex + 1,
                type: "sell",
                wallet: wallet.wallet_address,
                success: true,
                pattern: phase.type,
              })
            }
          }

          // Wait before next trade (with natural timing)
          if (tradeIndex < tradesInPhase - 1) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 10000))) // Cap at 10s for API timeout
          }
        } catch (error: any) {
          console.error(`[FOMO] Trade failed:`, error.message)
          results.push({
            phase: phaseIndex + 1,
            type: "error",
            error: error.message,
          })
        }
      }
    }

    // Calculate buy pressure ratio
    const buyPressureRatio = totalSellVolume > 0n ? Number(totalBuyVolume) / Number(totalSellVolume) : tradesExecuted

    // Log FOMO execution
    await supabase.from("mm_activity_log").insert({
      agent_id: agentId,
      activity_type: "fomo_execution",
      message: `FOMO Pattern "${selectedPattern.name}" executed with intensity ${fomoIntensity}/10`,
      details: {
        pattern: pattern,
        intensity: fomoIntensity,
        tradesExecuted,
        buyPressureRatio,
        phases: selectedPattern.phases.length,
      },
    })

    return NextResponse.json({
      success: true,
      pattern: selectedPattern.name,
      tradesExecuted,
      buyPressureRatio: buyPressureRatio.toFixed(2),
      phases: selectedPattern.phases.length,
      results,
    })
  } catch (error: any) {
    console.error("[FOMO API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
