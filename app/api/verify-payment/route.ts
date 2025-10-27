import { type NextRequest, NextResponse } from "next/server"
import { createClient as createViemClient, http, parseUnits } from "viem"
import { base, baseSepolia } from "viem/chains"
import { createClient } from "@/lib/supabase/server"
import { USDC_ADDRESS } from "@/lib/web3/contracts"

export async function POST(request: NextRequest) {
  try {
    const { txHash, trackId, listenerAddress, chunksPlayed } = await request.json()

    if (!txHash || !trackId || !listenerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Determine which chain to use (check both mainnet and testnet)
    let chain = base
    let viemClient = createViemClient({
      chain: base,
      transport: http(),
    })

    // Try to get transaction receipt
    let receipt
    try {
      receipt = await viemClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
    } catch {
      // If not found on mainnet, try testnet
      chain = baseSepolia
      viemClient = createViemClient({
        chain: baseSepolia,
        transport: http(),
      })
      receipt = await viemClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
    }

    if (!receipt || receipt.status !== "success") {
      return NextResponse.json({ error: "Transaction failed or not found" }, { status: 400 })
    }

    // Get track details to verify payment amount
    const supabase = await createClient()
    const { data: track } = await supabase
      .from("tracks")
      .select("price_per_chunk, artist_id")
      .eq("id", trackId)
      .single()

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    const expectedAmount = parseUnits(track.price_per_chunk.toString(), 6) // USDC has 6 decimals

    // Verify the transaction was a USDC transfer to the artist
    const transaction = await viemClient.getTransaction({ hash: txHash as `0x${string}` })

    if (transaction.to?.toLowerCase() !== USDC_ADDRESS[chain.id as keyof typeof USDC_ADDRESS].toLowerCase()) {
      return NextResponse.json({ error: "Invalid transaction recipient" }, { status: 400 })
    }

    // Update or create stream record
    const { data: existingStream } = await supabase
      .from("streams")
      .select("*")
      .eq("track_id", trackId)
      .eq("listener_address", listenerAddress)
      .single()

    if (existingStream) {
      await supabase
        .from("streams")
        .update({
          chunks_played: existingStream.chunks_played + (chunksPlayed || 1),
          total_paid: Number(existingStream.total_paid) + Number(track.price_per_chunk),
          last_played_at: new Date().toISOString(),
        })
        .eq("id", existingStream.id)
    } else {
      await supabase.from("streams").insert({
        track_id: trackId,
        listener_address: listenerAddress,
        chunks_played: chunksPlayed || 1,
        total_paid: track.price_per_chunk,
      })
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
