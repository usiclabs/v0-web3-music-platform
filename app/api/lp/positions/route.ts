import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("address")

    if (!userAddress) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    // Mock LP positions data - in production, fetch from blockchain
    const positions = [
      {
        id: "1",
        poolAddress: "0x1234...5678",
        token0Symbol: "ETH",
        token1Symbol: "USI",
        token0Amount: "10.5",
        token1Amount: "42000",
        liquidityTokens: "2500",
        feeTier: 3000,
        positionValue: "42500",
        feesEarned: "125.50",
        apr: 24.5,
        priceRange: "0.00025 - 0.00030",
        inRange: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        poolAddress: "0x8765...4321",
        token0Symbol: "ETH",
        token1Symbol: "ARTIST1",
        token0Amount: "5.2",
        token1Amount: "15000",
        liquidityTokens: "1200",
        feeTier: 10000,
        positionValue: "21000",
        feesEarned: "380.20",
        apr: 48.2,
        priceRange: "0.00030 - 0.00040",
        inRange: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    return NextResponse.json({ positions })
  } catch (error: any) {
    console.error("[v0] Failed to fetch LP positions:", error)
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 })
  }
}
