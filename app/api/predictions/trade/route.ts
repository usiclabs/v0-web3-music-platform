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

    if (!["BUY", "SELL"].includes(tradeType)) {
      return NextResponse.json({ error: "Invalid trade type" }, { status: 400 })
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

    if (tradeType === "SELL") {
      const { data: position } = await supabase
        .from("prediction_positions")
        .select("*")
        .eq("market_id", marketId)
        .eq("user_address", userAddress.toLowerCase())
        .eq("outcome_side", outcomeSide)
        .maybeSingle()

      if (!position || Number(position.shares) < amount) {
        return NextResponse.json({ error: "Insufficient shares to sell" }, { status: 400 })
      }

      // For selling: amount is shares to sell, calculate USDC received
      const k = yesPool * noPool
      let usdcReceived: number
      let newYesPool: number
      let newNoPool: number

      if (outcomeSide === "YES") {
        newYesPool = yesPool + amount
        newNoPool = k / newYesPool
        usdcReceived = noPool - newNoPool

        // Update pools
        await supabase
          .from("prediction_markets")
          .update({
            yes_pool: newYesPool,
            no_pool: newNoPool,
            total_volume: Number(market.total_volume) + usdcReceived,
            total_yes_volume: Number(market.total_yes_volume) + usdcReceived,
          })
          .eq("id", marketId)

        // Update position
        const newShares = Number(position.shares) - amount
        if (newShares > 0) {
          await supabase
            .from("prediction_positions")
            .update({
              shares: newShares,
              current_value: newShares,
              unrealized_pnl: newShares - Number(position.total_invested),
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", position.id)
        } else {
          await supabase.from("prediction_positions").delete().eq("id", position.id)
        }

        // Record sell trade
        await supabase.from("prediction_trades").insert({
          market_id: marketId,
          user_address: userAddress.toLowerCase(),
          trade_type: "SELL",
          outcome_side: outcomeSide,
          shares: amount,
          price_per_share: usdcReceived / amount,
          total_amount: usdcReceived,
          yes_probability: Math.round((newYesPool / (newYesPool + newNoPool)) * 100),
          no_probability: Math.round((newNoPool / (newYesPool + newNoPool)) * 100),
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, usdcReceived, pricePerShare: usdcReceived / amount })
      } else {
        // Similar logic for NO side
        newNoPool = noPool + amount
        newYesPool = k / newNoPool
        usdcReceived = yesPool - newYesPool

        await supabase
          .from("prediction_markets")
          .update({
            yes_pool: newYesPool,
            no_pool: newNoPool,
            total_volume: Number(market.total_volume) + usdcReceived,
            total_no_volume: Number(market.total_no_volume) + usdcReceived,
          })
          .eq("id", marketId)

        const newShares = Number(position.shares) - amount
        if (newShares > 0) {
          await supabase
            .from("prediction_positions")
            .update({
              shares: newShares,
              current_value: newShares,
              unrealized_pnl: newShares - Number(position.total_invested),
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", position.id)
        } else {
          await supabase.from("prediction_positions").delete().eq("id", position.id)
        }

        await supabase.from("prediction_trades").insert({
          market_id: marketId,
          user_address: userAddress.toLowerCase(),
          trade_type: "SELL",
          outcome_side: outcomeSide,
          shares: amount,
          price_per_share: usdcReceived / amount,
          total_amount: usdcReceived,
          yes_probability: Math.round((newYesPool / (newYesPool + newNoPool)) * 100),
          no_probability: Math.round((newNoPool / (newYesPool + newNoPool)) * 100),
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, usdcReceived, pricePerShare: usdcReceived / amount })
      }
    } else {
      const shares = calculateAMMTrade(yesPool, noPool, amount, outcomeSide)
      const pricePerShare = amount / shares

      const newYesPool = outcomeSide === "YES" ? yesPool - shares : yesPool + amount
      const newNoPool = outcomeSide === "NO" ? noPool - shares : noPool + amount

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

      const totalPool = newYesPool + newNoPool
      const { error: tradeError } = await supabase.from("prediction_trades").insert({
        market_id: marketId,
        user_address: userAddress.toLowerCase(),
        trade_type: "BUY",
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

      const { data: existingPosition } = await supabase
        .from("prediction_positions")
        .select("*")
        .eq("market_id", marketId)
        .eq("user_address", userAddress.toLowerCase())
        .eq("outcome_side", outcomeSide)
        .maybeSingle()

      if (existingPosition) {
        const newShares = Number(existingPosition.shares) + shares
        const newTotalInvested = Number(existingPosition.total_invested) + amount
        const newAvgPrice = newTotalInvested / newShares

        await supabase
          .from("prediction_positions")
          .update({
            shares: newShares,
            avg_price: newAvgPrice,
            total_invested: newTotalInvested,
            current_value: newShares,
            unrealized_pnl: newShares - newTotalInvested,
            last_updated_at: new Date().toISOString(),
          })
          .eq("id", existingPosition.id)
      } else {
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
    }
  } catch (error) {
    console.error("[API] Error processing trade:", error)
    return NextResponse.json({ error: "Failed to process trade" }, { status: 500 })
  }
}
