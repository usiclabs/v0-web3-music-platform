import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: referrals } = await supabase
      .from("referrals")
      .select(
        `
        *,
        referred:profiles!referrals_referred_address_fkey(*)
      `,
      )
      .eq("referrer_address", user.id)
      .order("created_at", { ascending: false })

    const activeCount = referrals?.filter((r) => r.is_active && r.first_stream_at).length || 0

    return NextResponse.json({
      referrals: referrals || [],
      totalReferrals: referrals?.length || 0,
      activeReferrals: activeCount,
      referralCode: `${user.id.slice(0, 8)}`,
    })
  } catch (error) {
    console.error("Referral fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { referred_address } = await request.json()

    const referralCode = `${user.id.slice(0, 8)}`

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_address: user.id,
        referred_address,
        referral_code: referralCode,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 })
  }
}
