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

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 500)
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status") // Filter by status if provided

    let query = supabase
      .from("stream_to_earn_rewards")
      .select("*")
      .eq("user_address", user.id)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: rewards, error: rewardsError, count } = await query.range(offset, offset + limit - 1)

    if (rewardsError) throw rewardsError

    // Get stats for this user
    const { data: stats } = await supabase
      .from("stream_to_earn_rewards")
      .select("reward_amount_usi,status")
      .eq("user_address", user.id)

    const totalEarned =
      stats?.reduce((sum, r) => sum + (r.status === "completed" ? Number(r.reward_amount_usi) : 0), 0) || 0
    const pendingAmount =
      stats?.reduce((sum, r) => sum + (r.status === "pending" ? Number(r.reward_amount_usi) : 0), 0) || 0

    return NextResponse.json({
      rewards,
      pagination: {
        limit,
        offset,
        total: count,
      },
      stats: {
        total_earned_usi: totalEarned,
        pending_usi: pendingAmount,
        completed_count: stats?.filter((r) => r.status === "completed").length || 0,
        pending_count: stats?.filter((r) => r.status === "pending").length || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching rewards:", error)
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
  }
}
