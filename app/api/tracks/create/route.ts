import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      artist_id,
      content_type,
      audio_url,
      video_url,
      cover_url,
      thumbnail_url,
      duration,
      price_per_chunk,
      unlock_type,
      royalty_splits,
      coin_address,
      token_id,
      nft_contract_address,
    } = body

    console.log("[v0] Creating track with metadata:", {
      title,
      description,
      artist_id,
      content_type,
      has_audio_url: !!audio_url,
      has_video_url: !!video_url,
      has_coin_address: !!coin_address,
      has_nft_contract: !!nft_contract_address,
      token_id,
    })

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Insert track
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .insert({
        title,
        description: description || null,
        artist_id: artist_id.toLowerCase(),
        content_type,
        audio_url,
        video_url,
        cover_url,
        thumbnail_url,
        duration,
        price_per_chunk,
        unlock_type,
        coin_address: coin_address || null,
        token_id: token_id || null,
        nft_contract_address: nft_contract_address || null,
      })
      .select()
      .single()

    if (trackError) {
      console.error("[v0] Track insert error:", trackError)
      throw trackError
    }

    console.log("[v0] Track created successfully:", track.id)

    // Insert royalty splits if provided
    if (royalty_splits && royalty_splits.length > 0) {
      const { error: splitsError } = await supabase.from("royalty_splits").insert(
        royalty_splits.map((split: { address: string; percentage: number }) => ({
          track_id: track.id,
          recipient_address: split.address,
          share_percentage: split.percentage,
        })),
      )

      if (splitsError) {
        console.error("[v0] Royalty splits insert error:", splitsError)
        throw splitsError
      }

      console.log("[v0] Royalty splits created successfully")
    }

    return NextResponse.json({ success: true, track })
  } catch (error) {
    console.error("[v0] Track creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create track" },
      { status: 500 },
    )
  }
}
