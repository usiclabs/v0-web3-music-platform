import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.toLowerCase().split(",") || []

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const walletAddress = request.headers.get("x-wallet-address")

    if (!walletAddress) {
      console.log("[v0] [Admin] No wallet address provided")
      return NextResponse.json({ error: "Unauthorized - No wallet address" }, { status: 401 })
    }

    // Check if wallet address is admin
    const isAdmin = ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())

    if (!isAdmin) {
      console.log("[v0] [Admin] Wallet address not in admin list:", walletAddress)
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    console.log("[v0] [Admin] Admin authenticated:", walletAddress)

    const supabase = await createServerClient()
    const trackId = params.id
    const body = await request.json()

    console.log("[v0] [Admin] Updating track:", trackId)
    console.log("[v0] [Admin] Update data:", {
      title: body.title,
      coin_address: body.coin_address,
      nft_contract_address: body.nft_contract_address,
      token_id: body.token_id,
    })

    // Validate track exists
    const { data: existingTrack, error: fetchError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .single()

    if (fetchError || !existingTrack) {
      console.error("[v0] [Admin] Track not found:", trackId)
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    console.log("[v0] [Admin] Existing track data:", {
      title: existingTrack.title,
      coin_address: existingTrack.coin_address,
      nft_contract_address: existingTrack.nft_contract_address,
    })

    // Update track with provided fields
    const updateData: any = {}

    // Allow updating these fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.coin_address !== undefined) updateData.coin_address = body.coin_address || null
    if (body.nft_contract_address !== undefined) updateData.nft_contract_address = body.nft_contract_address || null
    if (body.token_id !== undefined) updateData.token_id = body.token_id || null
    if (body.audio_url !== undefined) updateData.audio_url = body.audio_url
    if (body.cover_url !== undefined) updateData.cover_url = body.cover_url || null
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.price_per_chunk !== undefined) updateData.price_per_chunk = body.price_per_chunk
    if (body.unlock_type !== undefined) updateData.unlock_type = body.unlock_type
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: updatedTrack, error: updateError } = await supabase
      .from("tracks")
      .update(updateData)
      .eq("id", trackId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] [Admin] Failed to update track:", updateError)
      return NextResponse.json({ error: "Failed to update track", details: updateError.message }, { status: 500 })
    }

    console.log("[v0] [Admin] Track updated successfully:", {
      id: updatedTrack.id,
      title: updatedTrack.title,
      coin_address: updatedTrack.coin_address,
      nft_contract_address: updatedTrack.nft_contract_address,
    })

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    })
  } catch (error) {
    console.error("[v0] [Admin] Track update error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
