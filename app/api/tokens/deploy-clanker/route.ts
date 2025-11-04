import { NextResponse } from "next/server"
import { deployClankerERC20 } from "@/lib/erc20-deploy"

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[Clanker Token Deploy] Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body: JSON parsing failed" }, { status: 400 })
    }

    const { name, symbol, totalSupply, deployerAddress, trackId, coverImageUrl } = body

    console.log("[Clanker Token Deploy] Starting deployment:", { name, symbol, totalSupply, coverImageUrl })

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
        success: false,
        error: `Token deployment failed: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
