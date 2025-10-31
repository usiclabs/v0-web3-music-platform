import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { trackId, userId, chunkIndex, txHash, amount } = await request.json()

    if (!trackId || !userId || chunkIndex === undefined || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // USDC has 6 decimals, so divide by 1,000,000
    const amountInUsdc = Number.parseFloat(amount || "0") / 1_000_000

    const supabase = await createClient()

    // First, try to find an existing stream session
    const { data: existingStream } = await supabase
      .from("streams")
      .select("*")
      .eq("track_id", trackId)
      .eq("listener_address", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single()

    if (existingStream) {
      // Update existing stream with new chunk and payment info
      const { error: updateError } = await supabase
        .from("streams")
        .update({
          chunks_played: (existingStream.chunks_played || 0) + 1,
          total_paid: (Number.parseFloat(existingStream.total_paid || "0") + amountInUsdc).toString(),
          last_played_at: new Date().toISOString(),
        })
        .eq("id", existingStream.id)

      if (updateError) {
        console.error("[v0] Failed to update stream:", updateError.message)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Create new stream session
      const { error: insertError } = await supabase.from("streams").insert({
        track_id: trackId,
        listener_address: userId,
        chunks_played: 1,
        total_paid: amountInUsdc.toString(),
        started_at: new Date().toISOString(),
        last_played_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[v0] Failed to create stream:", insertError.message)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Record payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
