import { NextRequest, NextResponse } from "next/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const walletAddress = request.headers.get("x-wallet-address")
    const { thumbnail_url, cover_url } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    if (!thumbnail_url && !cover_url) {
      return NextResponse.json({ error: "thumbnail_url or cover_url required" }, { status: 400 })
    }

    const supabase = createBrowserClient()
    const { trackId } = params

    // Check if user is admin or track owner
    const adminAddresses = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.toLowerCase().split(",") || []
    const isAdmin = adminAddresses.includes(walletAddress.toLowerCase())

    // Get track to check ownership
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("artist_id")
      .eq("id", trackId)
      .single()

    if (trackError || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    const isOwner = track.artist_id.toLowerCase() === walletAddress.toLowerCase()

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized: Must be admin or track owner" }, { status: 403 })
    }

    // Update the track with new thumbnail/cover
    const updateData: any = {}
    if (thumbnail_url) updateData.thumbnail_url = thumbnail_url
    if (cover_url) updateData.cover_url = cover_url

    const { data: updatedTrack, error: updateError } = await supabase
      .from("tracks")
      .update(updateData)
      .eq("id", trackId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating track thumbnail:", updateError)
      return NextResponse.json({ error: "Failed to update thumbnail" }, { status: 500 })
    }

    console.log("[v0] Track thumbnail updated successfully:", trackId)

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    })
  } catch (error) {
    console.error("[v0] Error in thumbnail update API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
