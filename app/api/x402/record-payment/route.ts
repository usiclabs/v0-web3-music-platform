import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { trackId, userId, chunkIndex, txHash, amount } = await request.json()

    if (!trackId || !userId || chunkIndex === undefined || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // USDC has 6 decimals
    const amountInUsdc = Number.parseFloat(amount || "0") / 1_000_000

    const supabase = await createClient()

    // Create or retrieve artist for this track to update their earnings
    const { data: track } = await supabase
      .from("tracks")
      .select("artist_id")
      .eq("id", trackId)
      .single()

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Use a transaction-like approach: check if chunk payment already exists
    const { data: existingChunk } = await supabase
      .from("stream_chunks")
      .select("*")
      .eq("track_id", trackId)
      .eq("listener_address", userId)
      .eq("chunk_index", chunkIndex)
      .eq("tx_hash", txHash)
      .maybeSingle()

    // If payment already recorded for this exact chunk/tx, return success (idempotent)
    if (existingChunk) {
      console.log("[v0] Payment already recorded (idempotent):", { trackId, userId, chunkIndex, txHash })
      return NextResponse.json({ success: true, alreadyRecorded: true })
    }

    // Record the chunk payment atomically
    const { error: chunkError } = await supabase.from("stream_chunks").insert({
      track_id: trackId,
      listener_address: userId.toLowerCase(),
      chunk_index: chunkIndex,
      amount_paid: amountInUsdc,
      tx_hash: txHash,
      recorded_at: new Date().toISOString(),
    })

    if (chunkError) {
      console.error("[v0] Failed to record chunk payment:", chunkError.message)
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    // Update or create artist payment record
    const { data: existingPayment } = await supabase
      .from("artist_payments")
      .select("*")
      .eq("artist_id", track.artist_id)
      .eq("listener_address", userId.toLowerCase())
      .maybeSingle()

    if (existingPayment) {
      const { error: updateError } = await supabase
        .from("artist_payments")
        .update({
          total_earned: (Number.parseFloat(existingPayment.total_earned || "0") + amountInUsdc).toString(),
          chunks_count: (existingPayment.chunks_count || 0) + 1,
          last_payment_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id)

      if (updateError) {
        console.error("[v0] Failed to update artist payments:", updateError.message)
        return NextResponse.json({ error: "Failed to update payments" }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase.from("artist_payments").insert({
        artist_id: track.artist_id,
        listener_address: userId.toLowerCase(),
        total_earned: amountInUsdc.toString(),
        chunks_count: 1,
        last_payment_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[v0] Failed to create artist payments:", insertError.message)
        return NextResponse.json({ error: "Failed to create payments record" }, { status: 500 })
      }
    }

    // Also update the main streams table for analytics/summaries
    const { data: existingStream } = await supabase
      .from("streams")
      .select("*")
      .eq("track_id", trackId)
      .eq("listener_address", userId.toLowerCase())
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingStream) {
      const { error: updateError } = await supabase
        .from("streams")
        .update({
          chunks_played: (existingStream.chunks_played || 0) + 1,
          total_paid: (Number.parseFloat(existingStream.total_paid || "0") + amountInUsdc).toString(),
          last_played_at: new Date().toISOString(),
        })
        .eq("id", existingStream.id)

      if (updateError) {
        console.error("[v0] Failed to update stream summary:", updateError.message)
        // Don't fail if summary update fails - payment was already recorded
      }
    } else {
      const { error: insertError } = await supabase.from("streams").insert({
        track_id: trackId,
        listener_address: userId.toLowerCase(),
        chunks_played: 1,
        total_paid: amountInUsdc.toString(),
        started_at: new Date().toISOString(),
        last_played_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[v0] Failed to create stream summary:", insertError.message)
        // Don't fail if summary creation fails - payment was already recorded
      }
    }

    console.log("[v0] Payment recorded successfully:", {
      trackId,
      userId,
      chunkIndex,
      amountInUsdc,
      txHash,
    })

    return NextResponse.json({ success: true, amountRecorded: amountInUsdc })
  } catch (error) {
    console.error("[v0] Record payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
