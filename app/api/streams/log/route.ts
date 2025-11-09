import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Log all streaming activity - paid, token-gated, previews, etc.
export async function POST(request: NextRequest) {
  try {
    const { trackId, listenerAddress, chunkIndex, streamType } = await request.json()

    if (!trackId || !listenerAddress || chunkIndex === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find or create stream session
    const { data: existingStream } = await supabase
      .from("streams")
      .select("*")
      .eq("track_id", trackId)
      .eq("listener_address", listenerAddress.toLowerCase())
      .order("started_at", { ascending: false })
      .limit(1)
      .single()

    if (existingStream) {
      const { error: updateError } = await supabase
        .from("streams")
        .update({
          chunks_played: (existingStream.chunks_played || 0) + 1,
          last_played_at: new Date().toISOString(),
        })
        .eq("id", existingStream.id)

      if (updateError) {
        console.error("[v0] Failed to update stream:", updateError.message)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase.from("streams").insert({
        track_id: trackId,
        listener_address: listenerAddress.toLowerCase(),
        chunks_played: 1,
        total_paid: "0", // Free streams have 0 payment
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
    console.error("[v0] Log stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
