import { NextResponse } from "next/server"
import type { Address } from "viem"
import { getUserGasUsage } from "@/lib/eip3009/relayer"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("address")

    if (!userAddress) {
      // Return general subsidy info
      return NextResponse.json({
        available: true,
        maxSubsidyPerUser: 10,
        description: "Each user gets 10 free gasless transactions",
      })
    }

    // Get user-specific subsidy info
    const { totalTransactions, remainingSubsidy } = await getUserGasUsage(userAddress as Address)

    return NextResponse.json({
      available: remainingSubsidy > 0,
      remainingSubsidies: remainingSubsidy,
      totalUsed: totalTransactions,
      maxSubsidyPerUser: 10,
    })
  } catch (error) {
    console.error("[API] Subsidy info error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get subsidy info",
      },
      { status: 500 },
    )
  }
}
