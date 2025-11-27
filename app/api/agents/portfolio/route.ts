import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/agents/portfolio
 * Get agent portfolio with current values
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: portfolio, error } = await supabase
      .from("agent_portfolio")
      .select("*")
      .eq("agent_id", agentId)
      .order("total_invested", { ascending: false })

    if (error) throw error

    // Calculate totals
    const totals = {
      totalInvested: 0,
      totalValue: 0,
      totalRealizedPnl: 0,
      totalUnrealizedPnl: 0,
    }

    portfolio?.forEach((item) => {
      totals.totalInvested += Number.parseFloat(item.total_invested || "0")
      totals.totalValue += Number.parseFloat(item.current_value || "0")
      totals.totalRealizedPnl += Number.parseFloat(item.realized_pnl || "0")
      totals.totalUnrealizedPnl += Number.parseFloat(item.unrealized_pnl || "0")
    })

    return NextResponse.json({ portfolio, totals })
  } catch (error: any) {
    console.error("[Agent Portfolio API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
