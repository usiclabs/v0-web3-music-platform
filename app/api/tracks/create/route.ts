import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const {
      title,
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
      token_gated_streaming,
      required_token_balance,
      ai_generated,
      ai_style,
      ai_prompt,
      is_tokenized,
    } = body

    if (!title || !artist_id || !content_type) {
      return NextResponse.json({ error: "Missing required fields: title, artist_id, content_type" }, { status: 400 })
    }

    console.log("[v0] Creating track with metadata:", {
      title,
      artist_id,
      content_type,
      has_audio_url: !!audio_url,
      has_video_url: !!video_url,
      has_coin_address: !!coin_address,
      has_nft_contract: !!nft_contract_address,
      token_id,
      token_gated_streaming,
      required_token_balance,
      ai_generated,
      has_ai_style: !!ai_style,
      has_ai_prompt: !!ai_prompt,
      is_tokenized,
    })

    let supabase
    try {
      supabase = createAdminClient()
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase admin client:", clientError)
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }

    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .insert({
        title,
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
        token_gated_streaming: token_gated_streaming || false,
        required_token_balance: required_token_balance || 0,
        ai_generated: ai_generated || false,
        ai_style: ai_style || null,
        ai_prompt: ai_prompt || null,
      })
      .select()
      .single()

    if (trackError) {
      console.error("[v0] Track insert error:", {
        code: trackError.code,
        message: trackError.message,
        details: trackError.details,
        hint: trackError.hint,
      })
      return NextResponse.json({ error: `Failed to create track: ${trackError.message}` }, { status: 500 })
    }

    console.log("[v0] Track created successfully:", track.id)

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
        // Don't fail the entire request if royalty splits fail, just log it
        console.warn("[v0] Warning: royalty splits creation failed, but track was created")
      } else {
        console.log("[v0] Royalty splits created successfully")
      }
    }

    return NextResponse.json({ success: true, track })
  } catch (error) {
    console.error("[v0] Unexpected track creation error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create track" },
      { status: 500 },
    )
  }
}
