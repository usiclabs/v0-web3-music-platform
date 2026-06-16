import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface EarningsRequest {
  artistId: string
  startDate?: string
  endDate?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get("artistId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase
      .from("artist_payments")
      .select("*")
      .eq("artist_id", artistId.toLowerCase())

    // Add date range filtering if provided
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data: payments, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching earnings:", error.message)
      return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
    }

    // Calculate total earnings with proper decimal handling (USDC uses 6 decimals)
    const totalEarnings = payments?.reduce((sum, payment) => {
      const earned = Number.parseFloat(payment.total_earned || "0")
      return sum + (Number.isFinite(earned) ? earned : 0)
    }, 0) || 0

    // Calculate breakdown by listener
    const earningsByListener = payments?.reduce(
      (acc: Record<string, number>, payment) => {
        const listener = payment.listener_address || "unknown"
        const earned = Number.parseFloat(payment.total_earned || "0")
        acc[listener] = (acc[listener] || 0) + (Number.isFinite(earned) ? earned : 0)
        return acc
      },
      {},
    ) || {}

    return NextResponse.json({
      totalEarnings: parseFloat(totalEarnings.toFixed(6)), // USDC has 6 decimals
      currency: "USDC",
      paymentCount: payments?.length || 0,
      earningsByListener,
      recentPayments: payments?.slice(0, 10) || [], // Top 10 recent payments
      dateRange: {
        start: startDate,
        end: endDate,
      },
    })
  } catch (error) {
    console.error("[v0] Earnings calculation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
