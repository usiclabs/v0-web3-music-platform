"use client"

import { Card } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/analytics-chart"
import { TrendingUp, DollarSign } from "lucide-react"

interface PlatformAnalyticsChartsProps {
  data: Array<{
    started_at: string
    chunks_played: number
    total_paid: number
  }>
}

export function PlatformAnalyticsCharts({ data }: PlatformAnalyticsChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-full overflow-hidden">
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group max-w-full overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          <span className="group-hover:text-primary transition-colors">Platform Streams Over Time</span>
        </h3>
        <AnalyticsChart data={data} type="plays" />
      </Card>

      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 sm:p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group max-w-full overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          <span className="group-hover:text-primary transition-colors">Platform Revenue Over Time</span>
        </h3>
        <AnalyticsChart data={data} type="earnings" />
      </Card>
    </div>
  )
}
