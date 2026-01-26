import { NextRequest, NextResponse } from "next/server"
import { MarketMakerV4Service } from "@/lib/agents/market-maker-agent-v4"
import { parseUnits, isAddress, type Address } from "viem"

export async function POST(request: NextRequest) {
  try {
    const { agentId, tokenAddress, amount, walletIndex = 1, ownerAddress } = await request.json()

    if (!agentId || !tokenAddress || !isAddress(tokenAddress) || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const mmService = new MarketMakerV4Service(agentId, ownerAddress)

    // Detect pool
    console.log(`[V4 Swap API] Detecting pool for token: ${tokenAddress}`)
    const poolDetection = await mmService.detectPoolConfiguration(tokenAddress)

    if (!poolDetection.isV4 || !poolDetection.poolKey) {
      return NextResponse.json({
        success: false,
        error: poolDetection.error || "No V4 pool detected for this token",
      })
    }

    // Execute swap
    const buyAmount = parseUnits(amount, 18)
    const swapResult = await mmService.executeV4Swap(tokenAddress as Address, poolDetection.poolKey, buyAmount, walletIndex)

    if (!swapResult.success) {
      return NextResponse.json({ success: false, error: swapResult.error })
    }

    return NextResponse.json({
      success: true,
      txHash: swapResult.txHash,
      amountOut: swapResult.amountOut,
      poolConfiguration: {
        fee: poolDetection.poolKey.fee,
        tickSpacing: poolDetection.poolKey.tickSpacing,
        hooks: poolDetection.poolKey.hooks,
        liquidity: poolDetection.liquidity?.toString(),
      },
    })
  } catch (error: any) {
    console.error("[V4 Swap API] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
