import { NextResponse } from "next/server"
import { deployClankerERC20 } from "@/lib/erc20-deploy"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, symbol, totalSupply, deployerAddress, trackId, coverImageUrl, version, advancedConfig } = body

    console.log("[Clanker Token Deploy] Starting deployment:", { name, symbol, totalSupply, coverImageUrl, version })

    // Validate required fields
    if (!name || !symbol || !deployerAddress) {
      return NextResponse.json({ error: "Missing required fields: name, symbol, deployerAddress" }, { status: 400 })
    }

    const result = await deployClankerERC20({
      name,
      symbol,
      totalSupply: totalSupply || "1000000000", // 1 billion default
      decimals: 18, // Standard ERC20 decimals
      deployerAddress,
      imageUrl: coverImageUrl, // Track artwork
      description: `Token for music track: ${name}`, // Track description
      version: version || "v4.0", // Default to v4.0 if not specified
      advancedConfig: advancedConfig || {}, // Pass through advanced configuration options
    })

    if (!result.success || !result.tokenAddress) {
      throw new Error(result.error || "Token deployment failed")
    }

    console.log("[Clanker Token Deploy] Deployment successful:", result.tokenAddress)

    return NextResponse.json({
      success: true,
      tokenAddress: result.tokenAddress,
      transactionHash: result.txHash,
    })
  } catch (error) {
    console.error("[Clanker Token Deploy] Deployment failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: `Token deployment failed: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
