"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TokenPriceChartProps {
  data: Array<{
    timestamp: string
    price: number
  }>
}

export function TokenPriceChart({ data }: TokenPriceChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
      fullDate: new Date(item.timestamp).toLocaleString(),
      price: item.price,
    }))
  }, [data])

  const chartConfig = {
    price: {
      label: "Price (USD)",
      color: "hsl(142 76% 56%)", // Bright green to match other charts
    },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-sm sm:text-base text-muted-foreground">
        No price data available yet
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
            <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 76% 56%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(142 76% 56%)" stopOpacity={0} />
            </linearGradient>
            <filter id="glowPrice">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(value) => `$${value.toFixed(6)}`}
          />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toFixed(8)}`} />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="hsl(142 76% 56%)"
            fill="url(#fillPrice)"
            strokeWidth={2}
            filter="url(#glowPrice)"
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: "hsl(142 76% 56%)", stroke: "hsl(142 76% 56%)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
