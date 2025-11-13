import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: leaderboard, error } = await supabase
      .from("referral_leaderboard")
      .select("*")
      .order("active_referrals", { ascending: false })
      .order("total_referrals", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Failed to fetch leaderboard:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    return NextResponse.json({
      leaderboard: leaderboard || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Leaderboard API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
