import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: pendingRewards } = await supabase
      .from("stream_to_earn_rewards")
      .select("COUNT(*)")
      .eq("status", "pending")

    const { data: completedRewards } = await supabase
      .from("stream_to_earn_rewards")
      .select("COUNT()")
      .eq("status", "completed")

    const { data: failedRewards } = await supabase
      .from("stream_to_earn_rewards")
      .select("COUNT()")
      .eq("status", "failed")

    const { data: distributedData } = await supabase
      .from("stream_to_earn_rewards")
      .select("reward_amount_usi")
      .eq("status", "completed")

    const totalDistributed = distributedData?.reduce((sum, row) => sum + (row.reward_amount_usi || 0), 0) || 0

    return NextResponse.json({
      stats: {
        pending_count: pendingRewards?.[0]?.count || 0,
        completed_count: completedRewards?.[0]?.count || 0,
        failed_count: failedRewards?.[0]?.count || 0,
        total_distributed_usi: totalDistributed,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching rewards stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
