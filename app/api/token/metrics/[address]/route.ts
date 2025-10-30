import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  marketCap: number
}

interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

export async function GET(request: Request, { params }: { params: { address: string } }) {
  try {
    const { address } = params

    if (!address) {
      return NextResponse.json({ error: "Token address is required" }, { status: 400 })
    }

    // Fetch data from DexScreener API
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`)
    }

    const data: DexScreenerResponse = await response.json()

    // If no pairs found, return default data
    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        holders: 0,
        txns24h: 0,
      })
    }

    // Get the pair with highest liquidity (most reliable)
    const mainPair = data.pairs.reduce((prev, current) =>
      (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev,
    )

    // Calculate total volume and liquidity across all pairs
    const totalVolume24h = data.pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0)
    const totalLiquidity = data.pairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0)
    const totalTxns24h = data.pairs.reduce(
      (sum, pair) => sum + (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
      0,
    )

    return NextResponse.json({
      price: Number.parseFloat(mainPair.priceUsd || "0"),
      priceChange24h: mainPair.priceChange?.h24 || 0,
      marketCap: mainPair.marketCap || mainPair.fdv || 0,
      volume24h: totalVolume24h,
      liquidity: totalLiquidity,
      holders: 0, // DexScreener doesn't provide holder count
      txns24h: totalTxns24h,
      pairAddress: mainPair.pairAddress,
      dexId: mainPair.dexId,
    })
  } catch (error) {
    console.error("[v0] Error fetching token metrics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch token metrics",
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        holders: 0,
        txns24h: 0,
      },
      { status: 500 },
    )
  }
}
