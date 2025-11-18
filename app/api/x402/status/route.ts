import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nonce = searchParams.get("nonce")

    if (!nonce) {
      return NextResponse.json({ error: "Missing nonce parameter" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check if payment exists in streams table
    const { data: payment } = await supabase
      .from("streams")
      .select("*")
      .contains("payment_nonces", [nonce])
      .maybeSingle()

    if (payment) {
      return NextResponse.json({
        pending: false,
        settled: true,
        trackId: payment.track_id,
        timestamp: payment.last_played_at,
      })
    }

    // Payment not found - could be pending or never created
    return NextResponse.json({
      pending: true,
      settled: false,
    })
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    )
  }
}
