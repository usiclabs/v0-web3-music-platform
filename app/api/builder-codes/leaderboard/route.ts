import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "all" // all, 30d, 7d, 24h

    let query = supabase
      .from("builder_codes")
      .select("*")
      .eq("is_active", true)
      .eq("verified", true)
      .order("total_earnings", { ascending: false })
      .limit(50)

    const { data: builders, error } = await query

    if (error) {
      console.error("Failed to fetch builder leaderboard:", error)
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      )
    }

    // If timeframe filter requested, get filtered stats
    if (timeframe !== "all") {
      let hoursAgo = 24
      if (timeframe === "7d") hoursAgo = 7 * 24
      if (timeframe === "30d") hoursAgo = 30 * 24

      const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

      const { data: usageData } = await supabase
        .from("builder_code_usage")
        .select("builder_code, amount, builder_fee")
        .gte("created_at", cutoffDate)

      // Aggregate by builder code
      const aggregated = usageData?.reduce((acc: Record<string, any>, row) => {
        if (!acc[row.builder_code]) {
          acc[row.builder_code] = {
            volume: 0,
            earnings: 0,
            transactions: 0,
          }
        }
        acc[row.builder_code].volume += parseFloat(row.amount)
        acc[row.builder_code].earnings += parseFloat(row.builder_fee)
        acc[row.builder_code].transactions += 1
        return acc
      }, {})

      // Merge with builder data and sort
      const enrichedBuilders = builders
        .map((builder) => ({
          ...builder,
          timeframeStats: aggregated?.[builder.code] || {
            volume: 0,
            earnings: 0,
            transactions: 0,
          },
        }))
        .sort((a, b) => b.timeframeStats.earnings - a.timeframeStats.earnings)

      return NextResponse.json({ builders: enrichedBuilders, timeframe })
    }

    return NextResponse.json({ builders, timeframe: "all" })
  } catch (error) {
    console.error("Builder leaderboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
