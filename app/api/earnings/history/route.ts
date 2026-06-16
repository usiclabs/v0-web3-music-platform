import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/earnings/history
 * Fetch artist earnings with optional date range filtering
 * 
 * Query params:
 * - artistId: string (required)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - limit: number (default 50, max 500)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const artistId = searchParams.get("artistId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50")), 500)

    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify authorization - user can only see their own earnings
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.wallet_address?.toLowerCase() !== artistId.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from("artist_payments")
      .select("*")
      .eq("artist_id", artistId.toLowerCase())
      .order("last_payment_at", { ascending: false })
      .limit(limit)

    // Apply date range filters if provided
    if (startDate) {
      const start = new Date(startDate).toISOString()
      query = query.gte("last_payment_at", start)
    }

    if (endDate) {
      const end = new Date(endDate).toISOString()
      query = query.lte("last_payment_at", end)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error("[v0] Error fetching earnings history:", error.message)
      return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
    }

    // Process and return payments with USDC decimal handling
    const processedPayments = payments?.map((payment) => ({
      ...payment,
      total_earned: Number.parseFloat(payment.total_earned || "0"),
      last_payment_at: payment.last_payment_at,
      chunks_count: payment.chunks_count || 0,
    })) || []

    const totalEarnings = processedPayments.reduce((sum, p) => sum + p.total_earned, 0)

    return NextResponse.json({
      success: true,
      payments: processedPayments,
      summary: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        paymentCount: processedPayments.length,
        chunksRecorded: processedPayments.reduce((sum, p) => sum + (p.chunks_count || 0), 0),
      },
    })
  } catch (error) {
    console.error("[v0] Earnings history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
