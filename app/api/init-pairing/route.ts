import { type NextRequest, NextResponse } from "next/server"
import { calculatePoolAmounts, calculateSqrtPriceX96 } from "@/lib/uniswap-v3-helpers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newToken, usiToken, fee, targetMcUsd, usiPriceUsd, totalSupply, adminFundingAddress } = body

    // Validate required fields
    if (!newToken || !usiToken || !fee || !targetMcUsd || !usiPriceUsd || !totalSupply || !adminFundingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[API] Pool initialization requested:", {
      newToken,
      usiToken,
      targetMcUsd,
      totalSupply,
    })

    // Calculate required amounts
    const amounts = calculatePoolAmounts(totalSupply, targetMcUsd, usiPriceUsd)

    // Calculate sqrtPriceX96 for pool initialization
    const { sqrtPriceX96, token0, token1 } = calculateSqrtPriceX96(newToken, usiToken, amounts.tokenPerUsi)

    // Determine which token is token0 and which is token1
    const isNewTokenToken0 = token0.toLowerCase() === newToken.toLowerCase()

    // Return the steps needed to initialize the pool
    // These will be displayed to the admin to execute manually
    return NextResponse.json({
      ok: true,
      amounts: {
        newToken: amounts.newTokenAmount.toString(),
        usi: amounts.usiAmount.toString(),
        pricePerToken: amounts.pricePerToken,
        tokenPerUsi: amounts.tokenPerUsi,
      },
      poolInfo: {
        token0,
        token1,
        fee,
        sqrtPriceX96: sqrtPriceX96.toString(),
      },
      steps: [
        {
          label: "Approve USI for Position Manager",
          description: `Approve ${(Number(amounts.usiAmount) / 1e18).toFixed(2)} USI tokens`,
          to: usiToken,
          functionName: "approve",
          args: [
            process.env.NEXT_PUBLIC_UNISWAP_V3_POSITION_MANAGER || "0x0000000000000000000000000000000000000000",
            amounts.usiAmount.toString(),
          ],
        },
        {
          label: "Approve New Token for Position Manager",
          description: `Approve ${(Number(amounts.newTokenAmount) / 1e18).toFixed(2)} ${isNewTokenToken0 ? "token0" : "token1"} tokens`,
          to: newToken,
          functionName: "approve",
          args: [
            process.env.NEXT_PUBLIC_UNISWAP_V3_POSITION_MANAGER || "0x0000000000000000000000000000000000000000",
            amounts.newTokenAmount.toString(),
          ],
        },
        {
          label: "Create and Initialize Pool",
          description: "Create the Uniswap V3 pool and set initial price",
          to: process.env.NEXT_PUBLIC_UNISWAP_V3_POSITION_MANAGER || "0x0000000000000000000000000000000000000000",
          functionName: "createAndInitializePoolIfNecessary",
          args: [token0, token1, fee, sqrtPriceX96.toString()],
        },
        {
          label: "Mint Initial Liquidity Position",
          description: "Add liquidity to the pool",
          to: process.env.NEXT_PUBLIC_UNISWAP_V3_POSITION_MANAGER || "0x0000000000000000000000000000000000000000",
          functionName: "mint",
          args: [
            {
              token0,
              token1,
              fee,
              tickLower: -887220, // Full range
              tickUpper: 887220, // Full range
              amount0Desired: isNewTokenToken0 ? amounts.newTokenAmount.toString() : amounts.usiAmount.toString(),
              amount1Desired: isNewTokenToken0 ? amounts.usiAmount.toString() : amounts.newTokenAmount.toString(),
              amount0Min: "0",
              amount1Min: "0",
              recipient: adminFundingAddress,
              deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            },
          ],
        },
      ],
    })
  } catch (error) {
    console.error("[API] Pool initialization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
