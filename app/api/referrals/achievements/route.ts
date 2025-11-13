import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wallet_address = user.user_metadata?.wallet_address

    if (!wallet_address) {
      return NextResponse.json({ error: "Wallet address not found" }, { status: 400 })
    }

    const { data: achievements } = await supabase
      .from("referral_achievements")
      .select("*")
      .eq("user_address", wallet_address)
      .order("unlocked_at", { ascending: false })

    const { count: activeReferrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_address", wallet_address)
      .eq("is_active", true)

    return NextResponse.json({
      achievements: achievements || [],
      activeReferrals: activeReferrals || 0,
    })
  } catch (error: any) {
    console.error("Achievements API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
