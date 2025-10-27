import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { X402_CONFIG } from "@/lib/web3/contracts"

// X402 streaming endpoint - returns 402 with payment instructions
export async function GET(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const { trackId } = params
    const searchParams = request.nextUrl.searchParams
    const chunkIndex = Number.parseInt(searchParams.get("chunk") || "0")

    // Get track details
    const supabase = await createClient()
    const { data: track, error } = await supabase
      .from("tracks")
      .select("*, profiles!tracks_artist_id_fkey(*)")
      .eq("id", trackId)
      .single()

    if (error || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Calculate chunk details
    const totalChunks = Math.ceil(track.duration / X402_CONFIG.CHUNK_DURATION)
    if (chunkIndex >= totalChunks) {
      return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 })
    }

    // Return 402 Payment Required with X402 payment instructions
    const paymentInstructions = {
      scheme: X402_CONFIG.SCHEME,
      network: X402_CONFIG.NETWORK,
      token: "USDC",
      amount: track.price_per_chunk.toString(),
      recipient: track.artist_id, // Artist wallet address
      metadata: {
        trackId: track.id,
        trackTitle: track.title,
        artistName: track.profiles?.artist_name || "Unknown Artist",
        chunkIndex,
        totalChunks,
        chunkDuration: X402_CONFIG.CHUNK_DURATION,
      },
    }

    return NextResponse.json(
      {
        error: "Payment Required",
        payment: paymentInstructions,
      },
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "X-Payment-Required": "true",
          "X-Payment-Scheme": X402_CONFIG.SCHEME,
          "X-Payment-Network": X402_CONFIG.NETWORK,
        },
      },
    )
  } catch (error) {
    console.error("[v0] X402 stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
