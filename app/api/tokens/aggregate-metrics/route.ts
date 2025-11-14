import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"
export const dynamic = "force-dynamic"

interface DexScreenerPair {
  chainId: string
  dexId: string
  pairAddress: string
  priceUsd: string
  volume: {
    h24: number
  }
  liquidity: {
    usd: number
  }
  fdv: number
  marketCap: number
}

interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

export async function GET() {
  const startTime = Date.now()
  console.log("[v0] [PERF] Starting aggregate metrics fetch")

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const dbStartTime = Date.now()
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("coin_address")
      .not("coin_address", "is", null)
      .eq("is_active", true)
    console.log(`[v0] [PERF] Database query took ${Date.now() - dbStartTime}ms`)

    if (error) {
      console.error("[v0] Error fetching tokenized tracks:", error)
      throw error
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json(
        {
          totalVolume24h: 0,
          totalMarketCap: 0,
          tokenCount: 0,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      )
    }

    console.log(`[v0] Fetching metrics for ${tracks.length} tokenized tracks`)
    console.log("[v0] Fetched tracks:", tracks.length, "profile tokens:", 0)

    const apiStartTime = Date.now()
    const metricsPromises = tracks.map(async (track) => {
      const tokenStartTime = Date.now()
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${track.coin_address}`, {
          headers: {
            Accept: "application/json",
          },
          next: { revalidate: 180 },
        })

        console.log(`[v0] [PERF] DexScreener API call for ${track.coin_address} took ${Date.now() - tokenStartTime}ms`)

        if (!response.ok) {
          console.error(`[v0] DexScreener API error for ${track.coin_address}: ${response.status}`)
          return { volume24h: 0, marketCap: 0 }
        }

        const data: DexScreenerResponse = await response.json()

        if (!data.pairs || data.pairs.length === 0) {
          return { volume24h: 0, marketCap: 0 }
        }

        const mainPair = data.pairs.reduce((prev, current) =>
          (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev,
        )

        const totalVolume24h = data.pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0)

        return {
          volume24h: totalVolume24h,
          marketCap: mainPair.marketCap || mainPair.fdv || 0,
        }
      } catch (error) {
        console.error(`[v0] Error fetching metrics for ${track.coin_address}:`, error)
        return { volume24h: 0, marketCap: 0 }
      }
    })

    const allMetrics = await Promise.all(metricsPromises)
    console.log(`[v0] [PERF] All DexScreener API calls took ${Date.now() - apiStartTime}ms`)

    const totalVolume24h = allMetrics.reduce((sum, metric) => sum + metric.volume24h, 0)
    const totalMarketCap = allMetrics.reduce((sum, metric) => sum + metric.marketCap, 0)

    console.log(`[v0] [PERF] Total aggregate metrics fetch took ${Date.now() - startTime}ms`)
    console.log(`[v0] Aggregate metrics: Volume=$${totalVolume24h.toFixed(2)}, MarketCap=$${totalMarketCap.toFixed(2)}`)

    return NextResponse.json(
      {
        totalVolume24h,
        totalMarketCap,
        tokenCount: tracks.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error("[v0] Error fetching aggregate token metrics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch aggregate token metrics",
        totalVolume24h: 0,
        totalMarketCap: 0,
        tokenCount: 0,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    )
  }
}
