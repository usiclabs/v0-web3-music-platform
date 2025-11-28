import { type NextRequest, NextResponse } from "next/server"
import { USDC_ADDRESS } from "@/lib/web3/contracts"

// x402 payment endpoint for AI song generation
// Returns 402 Payment Required with payment instructions

const GENERATION_PRICE_USDC = 1_000_000 // $1 USDC (6 decimals)
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_RELAYER_ADDRESS || "0x0000000000000000000000000000000000000000"

export async function GET(request: NextRequest) {
  try {
    const chainId = 8453 // Base mainnet
    const usdcAddress = USDC_ADDRESS[chainId]

    // Generate a unique nonce for this payment request
    const nonce = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    // Return 402 Payment Required with x402 payment instructions
    return NextResponse.json(
      {
        payment: {
          scheme: "exact",
          network: "base",
          token: usdcAddress,
          amount: GENERATION_PRICE_USDC.toString(),
          recipient: PLATFORM_WALLET,
          metadata: {
            type: "song_generation",
            nonce,
            description: "AI Song Generation - 1 USDC",
          },
        },
      },
      {
        status: 402,
        headers: {
          "X-Payment-Scheme": "exact",
          "X-Payment-Network": "base",
          "X-Payment-Token": usdcAddress,
          "X-Payment-Amount": GENERATION_PRICE_USDC.toString(),
        },
      },
    )
  } catch (error) {
    console.error("[v0] x402 generate error:", error)
    return NextResponse.json({ error: "Failed to create payment request" }, { status: 500 })
  }
}
