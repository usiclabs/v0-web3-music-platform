import { type NextRequest, NextResponse } from "next/server"
import { boostService } from "@/lib/agents/boost-service"
import { isAddress } from "viem"

export async function POST(req: NextRequest) {
  try {
    const { boostedByAddress, artistAddress, tokenAddress, tokenSymbol, fundingAmountEth } = await req.json()

    // Validate inputs
    if (!isAddress(boostedByAddress) || !isAddress(artistAddress) || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: "Invalid addresses" }, { status: 400 })
    }

    if (fundingAmountEth < 0.001) {
      return NextResponse.json({ error: "Minimum funding is 0.001 ETH" }, { status: 400 })
    }

    const { boost, wallet } = await boostService.createBoost(
      boostedByAddress,
      artistAddress,
      tokenAddress,
      tokenSymbol,
      fundingAmountEth,
    )

    return NextResponse.json({
      success: true,
      boost,
      wallet: {
        address: wallet.wallet_address,
      },
    })
  } catch (error: any) {
    console.error("[API] Boost creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
