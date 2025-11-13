import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { user_address, share_type, shared_id, platform, referral_code } = body

    if (!user_address || !share_type || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase.from("share_events").insert({
      user_address,
      share_type,
      shared_id: shared_id || null,
      platform,
      referral_code: referral_code || null,
    })

    if (error) {
      console.error("Failed to log share event:", error)
      return NextResponse.json({ error: "Failed to log share event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Share API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
