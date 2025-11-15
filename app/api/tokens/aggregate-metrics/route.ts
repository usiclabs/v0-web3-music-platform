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
    
    // Fetch track tokens
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("coin_address, title")
      .not("coin_address", "is", null)
      .eq("is_active", true)
    
    if (tracksError) {
      console.error("[v0] Error fetching tokenized tracks:", tracksError)
      throw tracksError
    }

    // Fetch profile tokens
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("profile_token_address, artist_name")
      .not("profile_token_address", "is", null)
    
    if (profilesError) {
      console.error("[v0] Error fetching profile tokens:", profilesError)
      throw profilesError
    }

    console.log(`[v0] [PERF] Database query took ${Date.now() - dbStartTime}ms`)

    // Combine both types of tokens
    const trackTokens = (tracks || []).map(t => ({
      coin_address: t.coin_address,
      title: t.title,
      type: 'track'
    }))
    
    const profileTokens = (profiles || []).map(p => ({
      coin_address: p.profile_token_address,
      title: `${p.artist_name} Token`,
      type: 'profile'
    }))
    
    const allTokens = [...trackTokens, ...profileTokens]
    // </CHANGE>

    if (allTokens.length === 0) {
      console.log("[v0] No tokens found in database")
      return NextResponse.json(
        {
          totalVolume24h: 0,
          totalMarketCap: 0,
          tokenCount: 0,
          debug: "No tokens with addresses found"
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      )
    }

    console.log(`[v0] Fetching metrics for ${allTokens.length} tokens (${trackTokens.length} tracks, ${profileTokens.length} profiles)`)

    const apiStartTime = Date.now()
    const metricsPromises = allTokens.map(async (token) => {
      const tokenStartTime = Date.now()
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
        
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.coin_address}`, {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        console.log(`[v0] DexScreener response for ${token.coin_address} (${token.title}, ${token.type}): status=${response.status}`)

        if (!response.ok) {
          console.error(`[v0] DexScreener API error for ${token.coin_address}: ${response.status}`)
          return { volume24h: 0, marketCap: 0, error: `HTTP ${response.status}` }
        }

        const data: DexScreenerResponse = await response.json()
        console.log(`[v0] DexScreener data for ${token.coin_address}:`, {
          hasPairs: !!data.pairs,
          pairCount: data.pairs?.length || 0,
          schemaVersion: data.schemaVersion
        })

        if (!data.pairs || data.pairs.length === 0) {
          console.log(`[v0] No pairs found for ${token.coin_address} (${token.title}, ${token.type})`)
          return { volume24h: 0, marketCap: 0, error: "No pairs" }
        }

        const mainPair = data.pairs.reduce((prev, current) =>
          (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev,
        )

        const totalVolume24h = data.pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0)

        console.log(`[v0] Metrics for ${token.coin_address} (${token.title}, ${token.type}):`, {
          volume24h: totalVolume24h,
          marketCap: mainPair.marketCap || mainPair.fdv || 0,
          liquidityUsd: mainPair.liquidity?.usd || 0,
          pairCount: data.pairs.length
        })

        return {
          volume24h: totalVolume24h,
          marketCap: mainPair.marketCap || mainPair.fdv || 0,
        }
      } catch (error: any) {
        console.error(`[v0] Error fetching metrics for ${token.coin_address} (${token.title}, ${token.type}):`, error.message)
        return { volume24h: 0, marketCap: 0, error: error.message }
      }
    })

    const allMetrics = await Promise.all(metricsPromises)
    console.log(`[v0] [PERF] All DexScreener API calls took ${Date.now() - apiStartTime}ms`)

    const successfulMetrics = allMetrics.filter(m => !m.error)
    const failedMetrics = allMetrics.filter(m => m.error)
    
    console.log(`[v0] Metrics summary: ${successfulMetrics.length} successful, ${failedMetrics.length} failed`)
    
    const totalVolume24h = allMetrics.reduce((sum, metric) => sum + metric.volume24h, 0)
    const totalMarketCap = allMetrics.reduce((sum, metric) => sum + metric.marketCap, 0)

    console.log(`[v0] [PERF] Total aggregate metrics fetch took ${Date.now() - startTime}ms`)
    console.log(`[v0] FINAL Aggregate metrics: Volume=$${totalVolume24h.toFixed(2)}, MarketCap=$${totalMarketCap.toFixed(2)}`)

    return NextResponse.json(
      {
        totalVolume24h,
        totalMarketCap,
        tokenCount: allTokens.length,
        debug: {
          successful: successfulMetrics.length,
          failed: failedMetrics.length,
          totalTracks: trackTokens.length,
          totalProfiles: profileTokens.length,
          totalTokens: allTokens.length
        }
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
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    )
  }
}
