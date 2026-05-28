"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface EarningsCardProps {
  amount: number
  currency?: string
}

export function EarningsCard({ amount, currency = "USDC" }: EarningsCardProps) {
  return (
    <div className="px-6 mb-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold text-gray-400 tracking-wider">TOTAL EARNINGS</h3>
          <Button variant="ghost" size="sm" className="h-8 text-xs bg-white/5 hover:bg-white/10">
            All time
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Main Value */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">${amount.toFixed(4)}</span>
              <span className="text-lg text-gray-400">{currency}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">All-time earnings</p>
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
      </div>
    </div>
  )
}
