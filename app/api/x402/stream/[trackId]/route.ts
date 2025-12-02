import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getX402Network, USDC_ADDRESS } from "@/lib/web3/contracts"
import { isAddress } from "viem"

// X402 streaming endpoint - returns 402 with payment instructions
export async function GET(request: NextRequest, { params }: { params: Promise<{ trackId: string }> }) {
  try {
    const { trackId } = await params
    const searchParams = request.nextUrl.searchParams
    const chunkIndex = Number.parseInt(searchParams.get("chunk") || "0")
    const chainId = Number.parseInt(searchParams.get("chainId") || "8453") // Default to Base mainnet

    // Get track details
    const supabase = await createClient()
    const { data: track, error } = await supabase
      .from("tracks")
      .select("*, profiles!tracks_artist_id_fkey(*), royalty_splits(*)")
      .eq("id", trackId)
      .single()

    if (error || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    if (!(chainId in USDC_ADDRESS)) {
      return NextResponse.json(
        { error: "Unsupported chain", supportedChains: Object.keys(USDC_ADDRESS).map(Number) },
        { status: 400 },
      )
    }

    // Calculate chunk details
    const chunkDuration = 30 // X402 spec
    const totalChunks = Math.ceil(track.duration / chunkDuration)
    if (chunkIndex >= totalChunks) {
      return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 })
    }

    const hasRoyaltySplits = track.royalty_splits && track.royalty_splits.length > 0
    const relayerAddress = process.env.NEXT_PUBLIC_RELAYER_ADDRESS
    const isRelayerValid = relayerAddress && isAddress(relayerAddress)

    // If there are royalty splits AND relayer is valid, payment goes to platform relayer for distribution
    // Otherwise, payment goes directly to artist
    let recipient: string
    let useRoyaltySplits = false

    if (hasRoyaltySplits && isRelayerValid) {
      recipient = relayerAddress as string
      useRoyaltySplits = true
      console.log("[v0] Payment will go to relayer for royalty split distribution:", recipient)
    } else {
      recipient = track.artist_id
      if (hasRoyaltySplits && !isRelayerValid) {
        console.warn(
          "[v0] WARNING: Track has royalty splits but NEXT_PUBLIC_RELAYER_ADDRESS is not a valid Ethereum address:",
          relayerAddress,
          "- Falling back to direct artist payment. Please update the environment variable to enable royalty splits.",
        )
      }
      console.log("[v0] Payment will go directly to artist:", recipient)
    }

    const network = getX402Network(chainId)

    // Return 402 Payment Required with X402 payment instructions
    const paymentInstructions = {
      scheme: "exact",
      network,
      chainId, // Include chainId in payment instructions
      token: "USDC",
      amount: track.price_per_chunk.toString(),
      recipient,
      metadata: {
        trackId: track.id,
        trackTitle: track.title,
        artistName: track.profiles?.artist_name || "Unknown Artist",
        chunkIndex,
        totalChunks,
        chunkDuration,
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
          "X-Payment-Scheme": "exact",
          "X-Payment-Network": network,
          "X-Payment-Chain-Id": chainId.toString(),
        },
      },
    )
  } catch (error) {
    console.error("[v0] X402 stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
