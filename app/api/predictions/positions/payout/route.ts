import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, marketId } = body

    const supabase = await createClient()

    // Get market to verify it's resolved
    const { data: market } = await supabase
      .from("prediction_markets")
      .select("*")
      .eq("id", marketId)
      .eq("is_active", false)
      .single()

    if (!market) {
      return NextResponse.json({ error: "Market not resolved or not found" }, { status: 400 })
    }

    // Get user's position
    const { data: position } = await supabase
      .from("prediction_positions")
      .select("*")
      .eq("market_id", marketId)
      .eq("user_address", userAddress.toLowerCase())
      .maybeSingle()

    if (!position) {
      return NextResponse.json({ error: "No position found" }, { status: 404 })
    }

    // Check if they won
    const wonMarket = position.outcome_side === (market.outcome_result ? "YES" : "NO")
    if (!wonMarket) {
      return NextResponse.json({ error: "You did not win this market", won: false }, { status: 400 })
    }

    // Check if already claimed
    const { data: existingPayout } = await supabase
      .from("prediction_payouts")
      .select("*")
      .eq("market_id", marketId)
      .eq("user_address", userAddress.toLowerCase())
      .eq("status", "completed")
      .maybeSingle()

    if (existingPayout) {
      return NextResponse.json({ error: "Payout already claimed" }, { status: 400 })
    }

    // Create payout record
    const payoutAmount = Number(position.shares) // $1 per winning share
    const profitAmount = payoutAmount - Number(position.total_invested)

    const { error } = await supabase.from("prediction_payouts").insert({
      market_id: marketId,
      user_address: userAddress.toLowerCase(),
      winning_side: position.outcome_side,
      shares_held: position.shares,
      payout_amount: payoutAmount,
      profit_amount: profitAmount,
      status: "completed",
      processed_at: new Date().toISOString(),
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      payoutAmount,
      profitAmount,
      shares: position.shares,
    })
  } catch (error) {
    console.error("[API] Error claiming payout:", error)
    return NextResponse.json({ error: "Failed to claim payout" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userAddress = searchParams.get("address")

    if (!userAddress) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all payouts for user
    const { data: payouts } = await supabase
      .from("prediction_payouts")
      .select(`
        *,
        prediction_markets(title, outcome_result)
      `)
      .eq("user_address", userAddress.toLowerCase())
      .order("processed_at", { ascending: false })

    return NextResponse.json(payouts || [])
  } catch (error) {
    console.error("[API] Error fetching payouts:", error)
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
  }
}
