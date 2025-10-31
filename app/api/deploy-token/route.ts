import { type NextRequest, NextResponse } from "next/server"
import { deployDirectERC20, deployExternalERC20, deployClankerERC20 } from "@/lib/erc20-deploy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, decimals, totalSupply, method, deployerAddress, targetMarketCapEth, feeTier } = body

    // Validate required fields
    if (!name || !symbol || !decimals || !totalSupply || !method || !deployerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[API] Token deployment requested:", { name, symbol, method })

    let result
    if (method === "direct") {
      result = await deployDirectERC20({
        name,
        symbol,
        decimals,
        totalSupply,
        deployerAddress,
      })
    } else if (method === "clanker") {
      result = await deployClankerERC20({
        name,
        symbol,
        decimals,
        totalSupply,
        deployerAddress,
        targetMarketCapEth,
        feeTier,
      })
    } else if (method === "external") {
      result = await deployExternalERC20({
        name,
        symbol,
        decimals,
        totalSupply,
        deployerAddress,
      })
    } else {
      return NextResponse.json({ error: "Invalid deployment method" }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Deployment failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tokenAddress: result.tokenAddress,
      txHash: result.txHash,
    })
  } catch (error) {
    console.error("[API] Token deployment error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
