import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get("timeframe") || "all" // all, month, week
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)

    const supabase = await createClient()

    let query = supabase.from("prediction_positions").select(`
        user_address,
        unrealized_pnl,
        total_invested
      `)

    // Filter by timeframe
    if (timeframe === "month") {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte("created_at", monthAgo)
    } else if (timeframe === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte("created_at", weekAgo)
    }

    const { data: positions } = await query

    if (!positions) {
      return NextResponse.json([])
    }

    // Aggregate by user
    const userStats = positions.reduce(
      (acc, pos) => {
        const address = pos.user_address
        if (!acc[address]) {
          acc[address] = { address, totalPnl: 0, totalInvested: 0, positions: 0 }
        }
        acc[address].totalPnl += Number(pos.unrealized_pnl)
        acc[address].totalInvested += Number(pos.total_invested)
        acc[address].positions += 1
        return acc
      },
      {} as Record<string, any>,
    )

    // Convert to array and sort by PnL
    const leaderboard = Object.values(userStats)
      .map((user) => ({
        ...user,
        returnPercentage: user.totalInvested > 0 ? (user.totalPnl / user.totalInvested) * 100 : 0,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl)
      .slice(0, limit)

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("[API] Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
