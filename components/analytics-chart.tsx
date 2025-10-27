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
    // Group data by date
    const grouped = data.reduce(
      (acc, item) => {
        const date = new Date(item.started_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, plays: 0, earnings: 0 }
        }
        acc[date].plays += item.chunks_played
        acc[date].earnings += Number(item.total_paid)
        return acc
      },
      {} as Record<string, { date: string; plays: number; earnings: number }>,
    )

    return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
