"use client"

import { Card } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/analytics-chart"
import { TokenPriceChart } from "@/components/token-price-chart"
import { TrendingUp, DollarSign, LineChart } from "lucide-react"
import useSWR from "swr"

interface TrackAnalyticsChartsProps {
  data: Array<{
    started_at: string
    chunks_played: number
    total_paid: number
  }>
  tokenAddress?: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TrackAnalyticsCharts({ data, tokenAddress }: TrackAnalyticsChartsProps) {
  const { data: priceData } = useSWR(tokenAddress ? `/api/token/price-history/${tokenAddress}` : null, fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  })

  const hasPriceData = tokenAddress && priceData?.priceHistory && priceData.priceHistory.length > 0

  return (
    <div className={`grid ${hasPriceData ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          <span className="group-hover:text-primary transition-colors">Plays Over Time</span>
        </h3>
        <AnalyticsChart data={data} type="plays" />
      </Card>

      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          <span className="group-hover:text-primary transition-colors">Earnings Over Time</span>
        </h3>
        <AnalyticsChart data={data} type="earnings" />
      </Card>

      {hasPriceData && (
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
            <span className="group-hover:text-primary transition-colors">Token Price (7 Days)</span>
          </h3>
          <TokenPriceChart data={priceData.priceHistory} />
        </Card>
      )}
    </div>
  )
}
