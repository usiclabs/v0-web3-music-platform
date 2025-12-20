import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Get trade history for this market ordered by time
    const { data: trades } = await supabase
      .from("prediction_trades")
      .select("*")
      .eq("market_id", params.id)
      .order("confirmed_at", { ascending: true })
      .limit(100)

    if (!trades) {
      return NextResponse.json([])
    }

    // Format for chart
    const history = trades.map((trade) => ({
      timestamp: new Date(trade.confirmed_at).toLocaleTimeString(),
      yesProbability: trade.yes_probability,
      noProbability: trade.no_probability,
      volume: trade.total_amount,
    }))

    return NextResponse.json(history)
  } catch (error) {
    console.error("[API] Error fetching history:", error)
    return NextResponse.json([])
  }
}
