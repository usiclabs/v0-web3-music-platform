import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// AMM pricing formula: constant product (x * y = k)
function calculateAMMTrade(yesPool: number, noPool: number, amount: number, side: "YES" | "NO"): number {
  const k = yesPool * noPool // constant product

  if (side === "YES") {
    // Buying YES: add amount to NO pool, calculate new YES pool
    const newNoPool = noPool + amount
    const newYesPool = k / newNoPool
    return yesPool - newYesPool // shares received
  } else {
    // Buying NO: add amount to YES pool, calculate new NO pool
    const newYesPool = yesPool + amount
    const newNoPool = k / newYesPool
    return noPool - newNoPool // shares received
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, userAddress, tradeType, outcomeSide, amount } = body

    if (tradeType !== "BUY") {
      return NextResponse.json({ error: "Sell functionality coming soon" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current market state
    const { data: market, error: marketError } = await supabase
      .from("prediction_markets")
      .select("*")
      .eq("id", marketId)
      .single()

    if (marketError) throw marketError
    if (!market.is_active) {
      return NextResponse.json({ error: "Market is not active" }, { status: 400 })
    }

    const yesPool = Number(market.yes_pool)
    const noPool = Number(market.no_pool)

    // Calculate shares using AMM formula
    const shares = calculateAMMTrade(yesPool, noPool, amount, outcomeSide)
    const pricePerShare = amount / shares

    // Update pools
    const newYesPool = outcomeSide === "YES" ? yesPool - shares : yesPool + amount
    const newNoPool = outcomeSide === "NO" ? noPool - shares : noPool + amount

    // Update market
    const { error: updateError } = await supabase
      .from("prediction_markets")
      .update({
        yes_pool: newYesPool,
        no_pool: newNoPool,
        total_volume: Number(market.total_volume) + amount,
        total_yes_volume: outcomeSide === "YES" ? Number(market.total_yes_volume) + amount : market.total_yes_volume,
        total_no_volume: outcomeSide === "NO" ? Number(market.total_no_volume) + amount : market.total_no_volume,
      })
      .eq("id", marketId)

    if (updateError) throw updateError

    // Record trade
    const totalPool = newYesPool + newNoPool
    const { error: tradeError } = await supabase.from("prediction_trades").insert({
      market_id: marketId,
      user_address: userAddress.toLowerCase(),
      trade_type: tradeType,
      outcome_side: outcomeSide,
      shares,
      price_per_share: pricePerShare,
      total_amount: amount,
      yes_probability: Math.round((newYesPool / totalPool) * 100),
      no_probability: Math.round((newNoPool / totalPool) * 100),
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })

    if (tradeError) throw tradeError

    // Update or create position
    const { data: existingPosition } = await supabase
      .from("prediction_positions")
      .select("*")
      .eq("market_id", marketId)
      .eq("user_address", userAddress.toLowerCase())
      .eq("outcome_side", outcomeSide)
      .maybeSingle()

    if (existingPosition) {
      // Update existing position
      const newShares = Number(existingPosition.shares) + shares
      const newTotalInvested = Number(existingPosition.total_invested) + amount
      const newAvgPrice = newTotalInvested / newShares

      await supabase
        .from("prediction_positions")
        .update({
          shares: newShares,
          avg_price: newAvgPrice,
          total_invested: newTotalInvested,
          current_value: newShares, // Max payout = 1 USDC per share
          unrealized_pnl: newShares - newTotalInvested,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", existingPosition.id)
    } else {
      // Create new position
      await supabase.from("prediction_positions").insert({
        market_id: marketId,
        user_address: userAddress.toLowerCase(),
        outcome_side: outcomeSide,
        shares,
        avg_price: pricePerShare,
        total_invested: amount,
        current_value: shares,
        unrealized_pnl: shares - amount,
      })
    }

    return NextResponse.json({ success: true, shares, pricePerShare })
  } catch (error) {
    console.error("[API] Error processing trade:", error)
    return NextResponse.json({ error: "Failed to process trade" }, { status: 500 })
  }
}
