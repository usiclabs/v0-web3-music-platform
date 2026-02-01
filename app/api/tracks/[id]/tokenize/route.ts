import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Updates track tokenization status after successful coin/token creation
 * This endpoint is called after a coin is successfully deployed
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient()
    const { id } = params
    const body = await request.json()

    const {
      is_tokenized,
      coin_address,
      token_id,
    }: { is_tokenized?: boolean; coin_address?: string; token_id?: string } = body

    // Verify track exists
    const { data: track, error: fetchError } = await supabase
      .from("tracks")
      .select("id, artist_id")
      .eq("id", id)
      .single()

    if (fetchError || !track) {
      console.error("[v0] Track not found for tokenization update:", id)
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (is_tokenized !== undefined) updateData.is_tokenized = is_tokenized
    if (coin_address) updateData.coin_address = coin_address
    if (token_id) updateData.token_id = token_id

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    console.log("[v0] Updating track tokenization:", {
      trackId: id,
      updates: updateData,
    })

    // Update track with tokenization status
    const { data: updatedTrack, error: updateError } = await supabase
      .from("tracks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Track tokenization update error:", updateError)
      return NextResponse.json({ error: "Failed to update track tokenization status" }, { status: 500 })
    }

    console.log("[v0] Track tokenization updated successfully:", updatedTrack.id)

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    })
  } catch (error) {
    console.error("[v0] Tokenization status update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update tokenization status" },
      { status: 500 },
    )
  }
}
