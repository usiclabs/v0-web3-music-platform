import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const agentId = request.nextUrl.searchParams.get("agent_id")
    const limit = Number(request.nextUrl.searchParams.get("limit") || "50")

    if (!agentId) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 })
    }

    // Fetch recent swap history
    const { data: swaps, error } = await supabase
      .from("mm_v4_swaps")
      .select("*, mm_v4_pools(currency0, currency1)")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    // Calculate metrics
    const buySwaps = swaps.filter((s) => s.swap_direction === "buy")
    const sellSwaps = swaps.filter((s) => s.swap_direction === "sell")
    const totalProfitLoss = swaps.reduce((sum, s) => sum + (s.profit_loss || 0), 0)
    const completedSwaps = swaps.filter((s) => s.status === "completed")
    const successRate = completedSwaps.length > 0 ? (completedSwaps.length / swaps.length) * 100 : 0

    return NextResponse.json({
      swaps,
      metrics: {
        totalSwaps: swaps.length,
        buyCount: buySwaps.length,
        sellCount: sellSwaps.length,
        successRate,
        totalProfitLoss,
        completedSwaps: completedSwaps.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching swap history:", error)
    return NextResponse.json({ error: "Failed to fetch swap history" }, { status: 500 })
  }
}
