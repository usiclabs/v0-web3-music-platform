"use client"

import { useEffect, useState } from "react"
import { TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react"
import { TokenMetricsModal } from "@/components/token-metrics-modal"

interface TickerData {
  symbol: string
  price: string
  change: string
  volume: string
  marketCap: string
  contractAddress: string
}

export function BlockchainTicker() {
  const [data, setData] = useState<TickerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchUSIData = async () => {
      try {
        const response = await fetch(
          "https://api.dexscreener.com/latest/dex/tokens/0xECE5d962d17901ef200Da050C7c74AB45C96Db07",
        )

        if (!response.ok) {
          throw new Error("Failed to fetch token data")
        }

        const result = await response.json()
        const pair = result.pairs?.[0]

        if (!pair) {
          throw new Error("No pair data found")
        }

        const formatPrice = (price: string) => {
          const num = Number.parseFloat(price)
          if (num < 0.01) return `$${num.toFixed(6)}`
          if (num < 1) return `$${num.toFixed(4)}`
          return `$${num.toFixed(2)}`
        }

        const formatChange = (change: number) => {
          const sign = change >= 0 ? "+" : ""
          return `${sign}${change.toFixed(2)}%`
        }

        const formatVolume = (volume: string) => {
          const num = Number.parseFloat(volume)
          if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
          if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
          if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
          return `$${num.toFixed(2)}`
        }

        const formatMarketCap = (marketCap: string) => {
          const num = Number.parseFloat(marketCap)
          if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
          if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
          if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
          return `$${num.toFixed(2)}`
        }

        const updatedUSIData: TickerData = {
          symbol: "$USI",
          price: formatPrice(pair.priceUsd),
          change: formatChange(pair.priceChange?.h24 || 0),
          volume: formatVolume(pair.volume?.h24 || "0"),
          marketCap: formatMarketCap(pair.fdv || pair.marketCap || "0"),
          contractAddress: "0xECE5d962d17901ef200Da050C7c74AB45C96Db07",
        }

        setData(updatedUSIData)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch $USI token data:", error)
        setIsLoading(false)
      }
    }

    fetchUSIData()
    const interval = setInterval(fetchUSIData, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading || !data) {
    return (
      <div className="sticky top-14 sm:top-16 z-40 w-full border-b border-border/40 bg-muted/30 backdrop-blur-xl">
        <div className="h-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>Loading $USI token data...</span>
          </div>
        </div>
      </div>
    )
  }

  const isPositive = data.change.startsWith("+")

  return (
    <>
      <div
        className="sticky top-14 sm:top-16 z-40 w-full border-b border-border/40 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 backdrop-blur-xl overflow-hidden cursor-pointer hover:from-primary/10 hover:via-accent/10 hover:to-primary/10 transition-all duration-300"
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setModalOpen(true)
          }
        }}
        aria-label="View detailed token metrics"
      >
        <div className="relative h-8 flex items-center">
          <div className="animate-scroll-left flex items-center gap-8 whitespace-nowrap px-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    {data.symbol}: <span className="font-mono text-primary font-semibold">{data.price}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                  <span className="text-xs font-medium text-foreground">
                    24h:{" "}
                    <span className={`font-mono font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                      {data.change}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3 text-blue-400" />
                  <span className="text-xs font-medium text-foreground">
                    Volume: <span className="font-mono text-blue-400 font-semibold">{data.volume}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Market Cap: <span className="font-mono text-primary">{data.marketCap}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">Base Network</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TokenMetricsModal open={modalOpen} onOpenChange={setModalOpen} tokenData={data} />
    </>
  )
}
