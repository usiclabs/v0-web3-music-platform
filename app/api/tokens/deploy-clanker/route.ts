import { NextResponse } from "next/server"
import { deployClankerERC20 } from "@/lib/erc20-deploy"

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] [Clanker Token Deploy] Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body: JSON parsing failed" }, { status: 400 })
    }

    const { name, symbol, totalSupply, deployerAddress, trackId, coverImageUrl } = body

    console.log("[v0] [Clanker Token Deploy] Starting deployment:", {
      name,
      symbol,
      totalSupply,
      totalSupplyType: typeof totalSupply,
      coverImageUrl,
      deployerAddress,
    })

    // Validate required fields
    if (!name || !symbol || !deployerAddress) {
      console.error("[v0] [Clanker Token Deploy] Missing required fields")
      return NextResponse.json({ error: "Missing required fields: name, symbol, deployerAddress" }, { status: 400 })
    }

    const parsedTotalSupply = typeof totalSupply === "string" ? Number.parseInt(totalSupply) : totalSupply || 1000000000

    console.log("[v0] [Clanker Token Deploy] Parsed total supply:", parsedTotalSupply)

    const result = await deployClankerERC20({
      name,
      symbol,
      totalSupply: parsedTotalSupply,
      decimals: 18, // Standard ERC20 decimals
      deployerAddress,
      imageUrl: coverImageUrl, // Track artwork
      description: `Token for music track: ${name}`, // Track description
    })

    console.log("[v0] [Clanker Token Deploy] Deployment result:", {
      success: result.success,
      hasTokenAddress: !!result.tokenAddress,
      hasTxHash: !!result.txHash,
      hasError: !!result.error,
    })

    if (!result.success || !result.tokenAddress) {
      console.error("[v0] [Clanker Token Deploy] Deployment failed:", result.error)
      throw new Error(result.error || "Token deployment failed")
    }

    console.log("[v0] [Clanker Token Deploy] Deployment successful:", result.tokenAddress)

    return NextResponse.json({
      success: true,
      tokenAddress: result.tokenAddress,
      transactionHash: result.txHash,
    })
  } catch (error) {
    console.error("[v0] [Clanker Token Deploy] Deployment failed with exception:", error)
    console.error("[v0] [Clanker Token Deploy] Error type:", typeof error)
    console.error("[v0] [Clanker Token Deploy] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

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
