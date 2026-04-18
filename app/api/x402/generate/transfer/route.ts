import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, isAddress } from "viem"
import { base } from "viem/chains"
import { createClient } from "@supabase/supabase-js"
import { getPlatformWalletAddress } from "@/lib/x402/platform-wallet"

const GENERATION_PRICE_USDC = 1_000_000 // $1 USDC (6 decimals)

export async function POST(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    const body = await request.json()
    const { from, txHash, nonce } = body

    if (!from || !isAddress(from)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    if (!txHash) {
      return NextResponse.json({ error: "Transaction hash required for x402 payment" }, { status: 400 })
    }

    const platformWallet = getPlatformWalletAddress()
    if (!platformWallet) {
      console.error("[v0] Platform wallet not configured")
      return NextResponse.json({ error: "Payment system not configured" }, { status: 503 })
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://mainnet.base.org",
      ),
    })

    // Verify the transaction was successful
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })

    if (!receipt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 400 })
    }

    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Transaction failed" }, { status: 400 })
    }

    // Record the payment in database
    await supabase.from("generation_payments").insert({
      wallet_address: from.toLowerCase(),
      tx_hash: txHash,
      amount_usdc: GENERATION_PRICE_USDC,
      nonce,
      status: "completed",
      created_at: new Date().toISOString(),
    })

    console.log("[v0] x402 generation payment verified:", { from, txHash, platformWallet })

    return NextResponse.json({
      success: true,
      txHash,
      message: "Payment verified successfully",
    })
  } catch (error) {
    console.error("[v0] x402 generate transfer error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transfer verification failed" },
      { status: 500 },
    )
  }
}
