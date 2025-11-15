import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()

    // Get builder code details
    const { data: builderCode, error } = await supabase
      .from("builder_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single()

    if (error || !builderCode) {
      return NextResponse.json(
        { error: "Builder code not found" },
        { status: 404 }
      )
    }

    // Get recent usage stats
    const { data: recentUsage } = await supabase
      .from("builder_code_usage")
      .select("*")
      .eq("builder_code", code)
      .order("created_at", { ascending: false })
      .limit(10)

    // Get 24h stats
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: last24h } = await supabase
      .from("builder_code_usage")
      .select("amount, builder_fee")
      .eq("builder_code", code)
      .gte("created_at", twentyFourHoursAgo)

    const stats24h = last24h?.reduce(
      (acc, row) => ({
        volume: acc.volume + parseFloat(row.amount),
        earnings: acc.earnings + parseFloat(row.builder_fee),
        transactions: acc.transactions + 1,
      }),
      { volume: 0, earnings: 0, transactions: 0 }
    )

    return NextResponse.json({
      builderCode,
      recentUsage: recentUsage || [],
      stats24h: stats24h || { volume: 0, earnings: 0, transactions: 0 },
    })
  } catch (error) {
    console.error("Failed to fetch builder code:", error)
    return NextResponse.json(
      { error: "Failed to fetch builder code" },
      { status: 500 }
    )
  }
}
