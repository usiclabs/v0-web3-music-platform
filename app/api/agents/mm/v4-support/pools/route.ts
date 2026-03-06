import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const agentId = request.nextUrl.searchParams.get("agent_id")

    if (!agentId) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 })
    }

    // Fetch all V4 pools for the agent
    const { data: pools, error: poolsError } = await supabase
      .from("mm_v4_pools")
      .select("*")
      .eq("agent_id", agentId)
      .eq("is_active", true)

    if (poolsError) throw poolsError

    // Fetch recent swaps for analytics
    const { data: recentSwaps, error: swapsError } = await supabase
      .from("mm_v4_swaps")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20)

    if (swapsError) throw swapsError

    // Calculate statistics
    const totalSwaps = recentSwaps.length
    const successfulSwaps = recentSwaps.filter((s) => s.status === "completed").length
    const totalVolume = recentSwaps.reduce((sum, s) => sum + Number(s.output_amount), 0)
    const avgProfitLoss = totalSwaps > 0 ? recentSwaps.reduce((sum, s) => sum + (s.profit_loss || 0), 0) / totalSwaps : 0

    return NextResponse.json({
      pools: pools || [],
      recentSwaps: recentSwaps || [],
      stats: {
        poolCount: pools?.length || 0,
        totalSwaps,
        successfulSwaps,
        totalVolume,
        avgProfitLoss,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching V4 pools:", error)
    return NextResponse.json({ error: "Failed to fetch V4 pools" }, { status: 500 })
  }
}
