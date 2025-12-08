import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fetch actual metrics from platform
async function fetchActualMetric(market: any): Promise<{ value: number; source: string }> {
  const { target_type, target_id, outcome_metric } = market

  try {
    switch (outcome_metric) {
      case "stream_count": {
        // Get total streams for artist or track
        const supabase = await createClient()

        if (target_type === "artist") {
          // Get all tracks by artist
          const { data: tracks } = await supabase.from("tracks").select("id").eq("artist_id", target_id)

          if (!tracks) return { value: 0, source: "supabase_streams" }

          const trackIds = tracks.map((t) => t.id)

          // Sum streams across all tracks
          const { data: streams } = await supabase.from("streams").select("chunks_played").in("track_id", trackIds)

          const totalStreams = streams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
          return { value: totalStreams, source: "supabase_streams" }
        } else if (target_type === "track") {
          const { data: streams } = await supabase.from("streams").select("chunks_played").eq("track_id", target_id)

          const totalStreams = streams?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
          return { value: totalStreams, source: "supabase_streams" }
        }
        break
      }

      case "market_cap_usd": {
        // Get token market cap from DexScreener
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/token/metrics/${target_id}`)
        const data = await response.json()
        return { value: data.marketCap || 0, source: "dexscreener" }
      }

      case "follower_count": {
        // Get follower count from follows table
        const supabase = await createClient()
        const { data: follows } = await supabase.from("follows").select("id").eq("following_address", target_id)

        return { value: follows?.length || 0, source: "supabase_follows" }
      }

      case "revenue_usd": {
        // Get total revenue from streams
        const supabase = await createClient()

        if (target_type === "artist") {
          const { data: tracks } = await supabase.from("tracks").select("id").eq("artist_id", target_id)

          if (!tracks) return { value: 0, source: "supabase_streams" }

          const trackIds = tracks.map((t) => t.id)
          const { data: streams } = await supabase.from("streams").select("total_paid").in("track_id", trackIds)

          const totalRevenue = streams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
          return { value: totalRevenue, source: "supabase_streams" }
        }
        break
      }

      case "token_price_usd": {
        // Get token price from DexScreener
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/token/metrics/${target_id}`)
        const data = await response.json()
        return { value: data.price || 0, source: "dexscreener" }
      }
    }

    return { value: 0, source: "unknown" }
  } catch (error) {
    console.error(`[API] Error fetching metric ${outcome_metric}:`, error)
    return { value: 0, source: "error" }
  }
}

// Check if outcome condition is met
function checkOutcome(actualValue: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case ">=":
      return actualValue >= threshold
    case ">":
      return actualValue > threshold
    case "<=":
      return actualValue <= threshold
    case "<":
      return actualValue < threshold
    case "=":
      return actualValue === threshold
    default:
      return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId } = body

    const supabase = await createClient()

    // Get market
    const { data: market, error: marketError } = await supabase
      .from("prediction_markets")
      .select("*")
      .eq("id", marketId)
      .single()

    if (marketError) throw marketError
    if (!market.is_active) {
      return NextResponse.json({ error: "Market already resolved" }, { status: 400 })
    }

    // Check if resolution date has passed
    if (new Date(market.resolution_date) > new Date()) {
      return NextResponse.json({ error: "Market has not reached resolution date yet" }, { status: 400 })
    }

    // Fetch actual metric value
    const { value: actualValue, source } = await fetchActualMetric(market)

    // Determine outcome
    const outcomeResult = checkOutcome(actualValue, Number(market.outcome_threshold), market.outcome_operator)

    // Update market with resolution
    const { error: updateError } = await supabase
      .from("prediction_markets")
      .update({
        is_active: false,
        resolved_at: new Date().toISOString(),
        resolution_value: actualValue,
        outcome_result: outcomeResult,
        verification_source: source,
      })
      .eq("id", marketId)

    if (updateError) throw updateError

    // Get all winning positions
    const winningSide = outcomeResult ? "YES" : "NO"
    const { data: winningPositions } = await supabase
      .from("prediction_positions")
      .select("*")
      .eq("market_id", marketId)
      .eq("outcome_side", winningSide)

    // Create payout records
    if (winningPositions && winningPositions.length > 0) {
      const payouts = winningPositions.map((position) => ({
        market_id: marketId,
        user_address: position.user_address,
        winning_side: winningSide,
        shares_held: position.shares,
        payout_amount: position.shares, // $1 per winning share
        profit_amount: Number(position.shares) - Number(position.total_invested),
        status: "pending",
      }))

      await supabase.from("prediction_payouts").insert(payouts)
    }

    return NextResponse.json({
      success: true,
      outcome: outcomeResult ? "YES" : "NO",
      actualValue,
      threshold: market.outcome_threshold,
      winnersCount: winningPositions?.length || 0,
    })
  } catch (error) {
    console.error("[API] Error resolving market:", error)
    return NextResponse.json({ error: "Failed to resolve market" }, { status: 500 })
  }
}
