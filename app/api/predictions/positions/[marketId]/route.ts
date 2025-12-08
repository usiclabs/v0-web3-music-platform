import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { marketId: string } }) {
  try {
    const { marketId } = params
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all positions for this user in this market
    const { data: positions, error } = await supabase
      .from("prediction_positions")
      .select("*")
      .eq("market_id", marketId)
      .eq("user_address", address.toLowerCase())

    if (error) throw error

    // Return combined position (YES or NO side with highest value)
    if (!positions || positions.length === 0) {
      return NextResponse.json(null)
    }

    // Return the position with the most shares
    const mainPosition = positions.reduce((prev, current) =>
      Number(current.shares) > Number(prev.shares) ? current : prev,
    )

    return NextResponse.json({
      ...mainPosition,
      shares: Number(mainPosition.shares),
      avg_price: Number(mainPosition.avg_price),
      total_invested: Number(mainPosition.total_invested),
      current_value: Number(mainPosition.current_value),
      unrealized_pnl: Number(mainPosition.unrealized_pnl),
    })
  } catch (error) {
    console.error("[API] Error fetching position:", error)
    return NextResponse.json({ error: "Failed to fetch position" }, { status: 500 })
  }
}
