import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "").toLowerCase().split(",")

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: streamId } = await params
    console.log("[v0] [Admin] Attempting to end stream:", streamId)

    // Get wallet address from headers
    const walletAddress = request.headers.get("x-wallet-address")
    console.log("[v0] [Admin] Wallet address from headers:", walletAddress)

    if (!walletAddress) {
      console.log("[v0] [Admin] No wallet address provided")
      return NextResponse.json({ error: "Unauthorized - No wallet address" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())
    console.log("[v0] [Admin] Is admin:", isAdmin)

    if (!isAdmin) {
      console.log("[v0] [Admin] User is not an admin")
      return NextResponse.json({ error: "Unauthorized - Not an admin" }, { status: 403 })
    }

    const supabase = await createClient()

    // First, verify the stream exists
    const { data: existingStream, error: fetchError } = await supabase
      .from("live_streams")
      .select("id, is_live, title, artist_address")
      .eq("id", streamId)
      .single()

    if (fetchError || !existingStream) {
      console.error("[v0] [Admin] Stream not found:", streamId, fetchError)
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    console.log("[v0] [Admin] Found stream:", existingStream.title, "is_live:", existingStream.is_live)

    // Update the stream to end it
    const { data: updatedStream, error: updateError } = await supabase
      .from("live_streams")
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", streamId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] [Admin] Failed to update stream:", updateError)
      return NextResponse.json({ error: "Failed to end stream", details: updateError.message }, { status: 500 })
    }

    if (!updatedStream) {
      console.error("[v0] [Admin] No rows were updated for stream:", streamId)
      return NextResponse.json({ error: "Failed to update stream - no rows affected" }, { status: 500 })
    }

    console.log("[v0] [Admin] Stream ended successfully:", updatedStream)

    return NextResponse.json({
      success: true,
      stream: updatedStream,
    })
  } catch (error) {
    console.error("[v0] [Admin] Error ending stream:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
