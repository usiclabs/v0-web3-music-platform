"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AnalyticsChartProps {
  data: Array<{
    started_at: string
    chunks_played: number
    total_paid: number
  }>
  type: "plays" | "earnings"
}

export function AnalyticsChart({ data, type }: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    console.log("[v0] Raw data received in AnalyticsChart:", data.length, "items")
    console.log("[v0] Data date range:", data.length > 0 ? [data[0].started_at, data[data.length - 1].started_at] : "No data")
    // Group data by date
    const grouped = data.reduce(
      (acc, item) => {
        const d = new Date(item.started_at)
        // Format as YYYY-MM-DD for proper sorting and display
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        const dateKey = `${year}-${month}-${day}`
        const displayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        if (!acc[dateKey]) {
          acc[dateKey] = { dateKey, date: displayDate, plays: 0, earnings: 0 }
        }
        acc[dateKey].plays += item.chunks_played
        acc[dateKey].earnings += Number(item.total_paid)
        return acc
      },
      {} as Record<string, { dateKey: string; date: string; plays: number; earnings: number }>,
    )

    const result = Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    console.log("[v0] Grouped chart data:", result.length, "dates. Last 3:", result.slice(-3).map(r => r.date))
    return result
  }, [data])

  const chartConfig = {
    value: {
      label: type === "plays" ? "Plays" : "Earnings",
      color: "hsl(142 76% 56%)", // Bright green
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-sm sm:text-base text-muted-foreground">
        No data available yet
      </div>
    )
  }

  const CustomDot = (props: any) => {
    const { cx, cy } = props
    return (
      <g>
        {/* Outer glow pulse */}
        <circle cx={cx} cy={cy} r={6} fill="hsl(142 76% 56%)" opacity={0.2} className="animate-ping" />
        {/* Middle glow */}
        <circle cx={cx} cy={cy} r={4} fill="hsl(142 76% 56%)" opacity={0.4} />
        {/* Inner dot */}
        <circle cx={cx} cy={cy} r={2} fill="hsl(142 76% 56%)" />
      </g>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 76% 56%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(142 76% 56%)" stopOpacity={0} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={35} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey={type === "plays" ? "plays" : "earnings"}
            stroke="hsl(142 76% 56%)"
            fill="url(#fillValue)"
            strokeWidth={2}
            filter="url(#glow)"
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: "hsl(142 76% 56%)", stroke: "hsl(142 76% 56%)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
