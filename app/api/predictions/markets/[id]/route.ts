import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (id === "create") {
      return NextResponse.json({ error: "Use /predictions/create instead" }, { status: 404 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid market ID format" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: market, error } = await supabase.from("prediction_markets").select("*").eq("id", id).single()

    if (error) throw error

    // Calculate probabilities
    const yesPool = Number(market.yes_pool)
    const noPool = Number(market.no_pool)
    const totalPool = yesPool + noPool
    const yes_probability = Math.round((yesPool / totalPool) * 100)
    const no_probability = 100 - yes_probability

    return NextResponse.json({
      ...market,
      yes_probability,
      no_probability,
      total_volume: Number(market.total_volume),
      outcome_threshold: Number(market.outcome_threshold),
      yes_pool: yesPool,
      no_pool: noPool,
    })
  } catch (error) {
    console.error("[API] Error fetching market:", error)
    return NextResponse.json({ error: "Failed to fetch market" }, { status: 500 })
  }
}
