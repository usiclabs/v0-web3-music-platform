import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const userAddress = req.nextUrl.searchParams.get("address")

    if (!userAddress) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: boosts, error } = await supabase
      .from("boosts")
      .select(`
        *,
        boost_wallets(*),
        boost_activity(*)
      `)
      .eq("boosted_by_address", userAddress.toLowerCase())
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      boosts: boosts || [],
    })
  } catch (error: any) {
    console.error("[API] Boosts list error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
