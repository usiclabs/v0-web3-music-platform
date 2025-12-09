import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAgentWalletService } from "@/lib/agents/wallet-service"
import type { Address } from "viem"

/**
 * POST /api/agents/portfolio/refresh-values
 * Refresh current values for all portfolio positions using live market data
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const walletService = getAgentWalletService()

    // Get all portfolio positions
    const { data: portfolio, error } = await supabase.from("agent_portfolio").select("*").eq("agent_id", agentId)

    if (error) throw error

    if (!portfolio || portfolio.length === 0) {
      return NextResponse.json({ message: "No positions to refresh", updated: 0 })
    }

    let updated = 0

    // Update each position with current market value
    for (const position of portfolio) {
      try {
        // Try to get a current quote to determine market price
        const amount = BigInt(Math.floor(Number.parseFloat(position.amount) * 1e18))
        const quote = await walletService.getSwapQuote(position.token_address as Address, amount, false)

        if (quote) {
          // Calculate current value from quote
          const currentValue = Number.parseFloat(quote.amountOutFormatted)
          const unrealizedPnl = currentValue - Number.parseFloat(position.total_invested)

          await supabase
            .from("agent_portfolio")
            .update({
              current_value: currentValue,
              unrealized_pnl: unrealizedPnl,
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", position.id)

          updated++
        }
      } catch (error) {
        console.error(`Failed to refresh value for ${position.token_symbol}:`, error)
      }
    }

    return NextResponse.json({ message: "Portfolio values refreshed", updated })
  } catch (error: any) {
    console.error("[Portfolio Refresh API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
