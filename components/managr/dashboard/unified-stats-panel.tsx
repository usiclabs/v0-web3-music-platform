"use client"

import { TrendingUp, Target, Clock } from "lucide-react"

interface Stats {
  totalEarningsToday: number
  totalEarningsWeek: number
  totalEarningsMonth: number
  activeAgentsCount: number
  totalAgentsDeployed: number
}

interface UnifiedStatsPanelProps {
  stats: Stats
}

export function UnifiedStatsPanel({ stats }: UnifiedStatsPanelProps) {
  const averageDailyEarnings = (stats.totalEarningsMonth / 30).toFixed(2)
  const projectedMonthlyEarnings = (stats.totalEarningsToday * 30).toFixed(2)
  const growthWeekToToday =
    stats.totalEarningsWeek > 0
      ? (((stats.totalEarningsToday - stats.totalEarningsWeek / 7) / (stats.totalEarningsWeek / 7)) * 100).toFixed(1)
      : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Earnings Performance */}
      <div className="rounded-lg bg-gradient-to-br from-red-900/10 to-red-900/5 border border-red-500/20 p-6 hover:border-red-500/40 transition">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Earnings</p>
            <h3 className="text-2xl font-bold text-accent">${stats.totalEarningsMonth.toFixed(2)}</h3>
          </div>
          <TrendingUp className="w-6 h-6 text-red-400/60" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Today:</span>
            <span className="text-white">${stats.totalEarningsToday.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">This week:</span>
            <span className="text-white">${stats.totalEarningsWeek.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">This month:</span>
            <span className="text-white">${stats.totalEarningsMonth.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Agent Activity */}
      <div className="rounded-lg bg-gradient-to-br from-green-900/10 to-green-900/5 border border-green-500/20 p-6 hover:border-green-500/40 transition">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Agent Status</p>
            <h3 className="text-2xl font-bold text-green-400">
              {stats.activeAgentsCount}/{stats.totalAgentsDeployed}
            </h3>
          </div>
          <Target className="w-6 h-6 text-green-400/60" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-gray-700">
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${(stats.activeAgentsCount / stats.totalAgentsDeployed) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {((stats.activeAgentsCount / stats.totalAgentsDeployed) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {stats.activeAgentsCount} active out of {stats.totalAgentsDeployed} deployed agents
          </p>
        </div>
      </div>

      {/* Projections */}
      <div className="rounded-lg bg-gradient-to-br from-blue-900/10 to-blue-900/5 border border-blue-500/20 p-6 hover:border-blue-500/40 transition">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Projections</p>
            <h3 className="text-2xl font-bold text-blue-400">${projectedMonthlyEarnings}</h3>
          </div>
          <Clock className="w-6 h-6 text-blue-400/60" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Avg daily:</span>
            <span className="text-white">${averageDailyEarnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">If today continues:</span>
            <span className="text-white">${projectedMonthlyEarnings}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-700/30">
            <span className="text-gray-400">Day-over-day:</span>
            <span className={growthWeekToToday === "0" ? "text-gray-400" : "text-green-400"}>
              {growthWeekToToday === "0" ? "→" : `+${growthWeekToToday}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
