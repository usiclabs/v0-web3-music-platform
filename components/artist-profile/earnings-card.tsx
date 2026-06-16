"use client"

import { ChevronDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface EarningsCardProps {
  amount: number
  currency?: string
}

export function EarningsCard({ amount, currency = "USDC" }: EarningsCardProps) {
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "all">("all")

  // Mock trend data
  const trendData = {
    "7d": { value: amount * 0.15, trend: 12 },
    "30d": { value: amount * 0.35, trend: 8 },
    all: { value: amount, trend: 24 },
  }

  const currentData = trendData[timePeriod]

  return (
    <div className="px-6 mb-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold text-gray-400 tracking-wider">TOTAL EARNINGS</h3>
          <div className="flex gap-1 bg-white/5 rounded-full p-1">
            {(["7d", "30d", "all"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  timePeriod === period
                    ? "bg-red-500/20 text-red-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {period === "7d" ? "7d" : period === "30d" ? "30d" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Main Value with Trend */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">${currentData.value.toFixed(4)}</span>
              <span className="text-lg text-gray-400">{currency}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">+{currentData.trend}%</span>
              </div>
              <span className="text-xs text-gray-500">vs previous period</span>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="flex items-end gap-1">
            <div className="h-8 w-1 bg-red-500/40 rounded" />
            <div className="h-12 w-1 bg-red-500/60 rounded" />
            <div className="h-16 w-1 bg-red-500/80 rounded" />
            <div className="h-20 w-1 bg-red-500 rounded" />
            <div className="h-16 w-1 bg-red-500/80 rounded" />
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t border-white/10 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Streaming revenue</span>
            <span className="text-xs font-semibold text-white">${(currentData.value * 0.65).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Token trading fees</span>
            <span className="text-xs font-semibold text-white">${(currentData.value * 0.25).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Sponsorships</span>
            <span className="text-xs font-semibold text-white">${(currentData.value * 0.1).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
