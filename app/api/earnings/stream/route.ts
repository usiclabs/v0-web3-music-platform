import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get real-time earnings data for an artist with payment history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get("artistId")
    const trackId = searchParams.get("trackId")
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get artist total earnings summary
    const { data: artistPayments, error: paymentError } = await supabase
      .from("artist_payments")
      .select("total_earned, chunks_count, last_payment_at")
      .eq("artist_id", artistId)
      .maybeSingle()

    if (paymentError) {
      console.error("[v0] Failed to fetch artist payments:", paymentError.message)
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // Get recent chunk payments with details
    let chunksQuery = supabase
      .from("stream_chunks")
      .select(
        `
        id,
        track_id,
        listener_address,
        chunk_index,
        amount_paid,
        tx_hash,
        recorded_at,
        tracks:tracks(id, title),
        streams:streams(id, started_at)
      `,
        { count: "exact" }
      )

    // Filter by track if specified
    if (trackId) {
      chunksQuery = chunksQuery.eq("track_id", trackId)
    } else {
      // Join to get tracks for this artist
      chunksQuery = chunksQuery.in(
        "track_id",
        (await supabase
          .from("tracks")
          .select("id")
          .eq("artist_id", artistId)
          .then((res) => res.data?.map((t) => t.id) || []))
      )
    }

    const { data: recentPayments, count: totalPayments, error: chunksError } = await chunksQuery
      .order("recorded_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (chunksError) {
      console.error("[v0] Failed to fetch recent payments:", chunksError.message)
      return NextResponse.json({ error: chunksError.message }, { status: 500 })
    }

    // Calculate daily earnings breakdown
    const dailyEarnings: Record<string, number> = {}
    if (recentPayments) {
      for (const payment of recentPayments) {
        const date = new Date(payment.recorded_at).toISOString().split("T")[0]
        dailyEarnings[date] = (dailyEarnings[date] || 0) + payment.amount_paid
      }
    }

    const totalEarned = parseFloat(artistPayments?.total_earned || "0")
    const chunksCount = artistPayments?.chunks_count || 0

    return NextResponse.json({
      success: true,
      summary: {
        totalEarned,
        chunksCount,
        lastPaymentAt: artistPayments?.last_payment_at || null,
        averagePerChunk: chunksCount > 0 ? totalEarned / chunksCount : 0,
      },
      recentPayments: (recentPayments || []).map((payment) => ({
        id: payment.id,
        trackId: payment.track_id,
        trackTitle: payment.tracks?.title || "Unknown",
        listenerAddress: payment.listener_address,
        chunkIndex: payment.chunk_index,
        amountPaid: payment.amount_paid,
        txHash: payment.tx_hash,
        recordedAt: payment.recorded_at,
      })),
      dailyEarnings,
      pagination: {
        limit,
        offset,
        total: totalPayments || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Earnings stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
