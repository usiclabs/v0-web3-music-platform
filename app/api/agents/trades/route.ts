import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/agents/trades
 * Get agent trade history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: trades,
      error,
      count,
    } = await supabase
      .from("agent_trades")
      .select("*", { count: "exact" })
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Calculate stats
    const { data: allTrades } = await supabase
      .from("agent_trades")
      .select("trade_type, amount_in, amount_out, status")
      .eq("agent_id", agentId)

    const stats = {
      totalTrades: allTrades?.length || 0,
      successfulTrades: allTrades?.filter((t) => t.status === "confirmed").length || 0,
      totalBuyVolume: 0,
      totalSellVolume: 0,
    }

    allTrades?.forEach((trade) => {
      if (trade.trade_type === "buy") {
        stats.totalBuyVolume += Number.parseFloat(trade.amount_in)
      } else {
        stats.totalSellVolume += Number.parseFloat(trade.amount_out)
      }
    })

    return NextResponse.json({ trades, count, stats })
  } catch (error: any) {
    console.error("[Agent Trades API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
