"use client"

import { Card } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/analytics-chart"
import { TrendingUp, DollarSign } from "lucide-react"

interface TrackAnalyticsChartsProps {
  data: Array<{
    started_at: string
    chunks_played: number
    total_paid: number
  }>
}

export function TrackAnalyticsCharts({ data }: TrackAnalyticsChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
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
    </div>
  )
}
