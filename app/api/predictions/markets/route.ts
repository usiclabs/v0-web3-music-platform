import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") || "all"

    const supabase = await createClient()
    let query = supabase.from("prediction_markets").select("*")

    // Apply filters
    switch (filter) {
      case "active":
        query = query.eq("is_active", true)
        break
      case "ending_soon":
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        query = query.eq("is_active", true).lte("resolution_date", in24Hours)
        break
      case "resolved":
        query = query.eq("is_active", false).not("resolved_at", "is", null)
        break
    }

    const { data: markets, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    // Calculate probabilities for each market
    const marketsWithProbability = markets?.map((market) => {
      const yesPool = Number(market.yes_pool)
      const noPool = Number(market.no_pool)
      const totalPool = yesPool + noPool
      const yes_probability = Math.round((yesPool / totalPool) * 100)
      const no_probability = 100 - yes_probability

      return {
        ...market,
        yes_probability,
        no_probability,
        total_volume: Number(market.total_volume),
        outcome_threshold: Number(market.outcome_threshold),
      }
    })

    return NextResponse.json(marketsWithProbability || [])
  } catch (error) {
    console.error("[API] Error fetching markets:", error)
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      target_type,
      target_id,
      target_name,
      target_image_url,
      outcome_metric,
      outcome_threshold,
      outcome_operator,
      resolution_date,
      creator_address,
      verification_source,
    } = body

    const supabase = await createClient()

    const { data: market, error } = await supabase
      .from("prediction_markets")
      .insert({
        title,
        description,
        category,
        target_type,
        target_id,
        target_name,
        target_image_url,
        outcome_metric,
        outcome_threshold,
        outcome_operator: outcome_operator || ">=",
        resolution_date,
        creator_address: creator_address.toLowerCase(),
        verification_source,
        is_active: true,
        yes_pool: 100, // Initial liquidity
        no_pool: 100,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(market)
  } catch (error) {
    console.error("[API] Error creating market:", error)
    return NextResponse.json({ error: "Failed to create market" }, { status: 500 })
  }
}
