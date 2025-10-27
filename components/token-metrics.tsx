"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Coins, TrendingUp, TrendingDown, DollarSign, Droplets, BarChart3, Activity } from "lucide-react"
import { usePublicClient } from "wagmi"
import { formatUnits } from "viem"
import { USI_TOKEN_ADDRESS } from "@/lib/web3/contracts"
import { base } from "viem/chains"

interface TokenMetrics {
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  totalSupply: number
  circulatingSupply: number
  holders: number
  liquidity: number
  txns24h: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TokenMetrics() {
  const [totalSupply, setTotalSupply] = useState<number>(0)
  const publicClient = usePublicClient({ chainId: base.id })

  const { data: liveData, error } = useSWR("/api/token/metrics", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })

  useEffect(() => {
    async function fetchTotalSupply() {
      if (!publicClient) return

      try {
        const supply = await publicClient.readContract({
          address: USI_TOKEN_ADDRESS[base.id] as `0x${string}`,
          abi: [
            {
              inputs: [],
              name: "totalSupply",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ] as const,
          functionName: "totalSupply",
        })

        setTotalSupply(Number(formatUnits(supply, 18)))
      } catch (error) {
        console.error("[v0] Error fetching total supply:", error)
      }
    }

    fetchTotalSupply()
  }, [publicClient])

  const loading = !liveData && !error
  const metrics: TokenMetrics = {
    price: liveData?.price || 0,
    priceChange24h: liveData?.priceChange24h || 0,
    marketCap: liveData?.marketCap || 0,
    volume24h: liveData?.volume24h || 0,
    totalSupply: totalSupply,
    circulatingSupply: totalSupply * 0.85, // Assume 85% circulating
    holders: liveData?.holders || 0,
    liquidity: liveData?.liquidity || 0,
    txns24h: liveData?.txns24h || 0,
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4 sm:p-6 animate-pulse">
            <div className="h-8 bg-muted rounded mb-2" />
            <div className="h-6 bg-muted rounded mb-1" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load token metrics. Please try again later.</p>
      </Card>
    )
  }

  const isPositiveChange = metrics.priceChange24h >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 p-4 sm:p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          {isPositiveChange ? (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          ${metrics.price > 0 ? metrics.price.toFixed(6) : "0.000000"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
          <span>Token Price</span>
          <span className={isPositiveChange ? "text-green-500" : "text-red-500"}>
            {isPositiveChange ? "+" : ""}
            {metrics.priceChange24h.toFixed(2)}%
          </span>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20 p-4 sm:p-6 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </div>
          {metrics.marketCap > 0 && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.marketCap > 0 ? `$${(metrics.marketCap / 1000).toFixed(2)}K` : "$0"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">Market Cap</div>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 p-4 sm:p-6 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          </div>
          {metrics.volume24h > 0 && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.volume24h > 0 ? `$${(metrics.volume24h / 1000).toFixed(1)}K` : "$0"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">24h Volume</div>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 p-4 sm:p-6 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </div>
          {metrics.liquidity > 0 && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.liquidity > 0 ? `$${(metrics.liquidity / 1000).toFixed(1)}K` : "$0"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">Total Liquidity</div>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 p-4 sm:p-6 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.totalSupply > 0 ? `${(metrics.totalSupply / 1000000).toFixed(2)}M` : "0M"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">Total Supply</div>
      </Card>

      <Card className="bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent border-pink-500/20 p-4 sm:p-6 hover:border-pink-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.circulatingSupply > 0 ? `${(metrics.circulatingSupply / 1000000).toFixed(2)}M` : "0M"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">Circulating Supply</div>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 p-4 sm:p-6 hover:border-orange-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          </div>
          {metrics.txns24h > 0 && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.txns24h > 0 ? metrics.txns24h.toLocaleString() : "0"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">24h Transactions</div>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 p-4 sm:p-6 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 w-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          </div>
          {metrics.marketCap > 0 && metrics.volume24h > 0 && (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-bold mb-1 break-all">
          {metrics.marketCap > 0 && metrics.volume24h > 0
            ? `${((metrics.volume24h / metrics.marketCap) * 100).toFixed(1)}%`
            : "0%"}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">Volume/MCap Ratio</div>
      </Card>
    </div>
  )
}
