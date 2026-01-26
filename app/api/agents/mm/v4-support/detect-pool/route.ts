import { NextRequest, NextResponse } from "next/server"
import { PoolDetectionService } from "@/lib/agents/pool-detection-service"
import { isAddress } from "viem"

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress } = await request.json()

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: "Invalid token address" }, { status: 400 })
    }

    const detectionService = new PoolDetectionService()
    const result = await detectionService.detectAllPools(tokenAddress)
    const recommendation = detectionService.recommendPoolVersion(result)

    // Convert BigInt values to strings for JSON serialization
    const serializedResult = {
      ...result,
      v4Liquidity: result.v4Liquidity ? result.v4Liquidity.toString() : undefined,
      v3Liquidity: result.v3Liquidity ? result.v3Liquidity.toString() : undefined,
    }

    return NextResponse.json({
      detection: serializedResult,
      recommendation,
      message: `Token has ${result.hasV4Pool ? "V4" : result.hasV3Pool ? "V3" : "no"} pool. Recommended: ${recommendation}`,
    })
  } catch (error: any) {
    console.error("[Pool Detection API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
