"use client"

import { formatDistanceToNow } from "date-fns"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  musician: {
    address: string
    name: string
    avatarUrl: string | null
  }
  stats: {
    totalEarningsToday: number
    totalEarningsWeek: number
    totalEarningsMonth: number
    activeAgentsCount: number
    totalAgentsDeployed: number
  }
}

export function DashboardHeader({ musician, stats }: DashboardHeaderProps) {
  return (
    <div className="border-b border-slate-700/50 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/managr" className="flex items-center gap-2 text-slate-400 hover:text-white transition group">
            <span className="group-hover:-translate-x-1 transition">←</span>
            Back to MANAGR
          </Link>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Connected Wallet</p>
            <p className="font-mono text-sm text-slate-200">{musician.address.slice(0, 10)}...</p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold font-display mb-2 text-balance leading-tight">
            Welcome back,
            <br />
            <span className="text-red-500">{musician.name}</span>
          </h1>
          <p className="text-lg text-slate-400">Your autonomous agent team is ready to execute</p>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "TODAY", value: `$${stats.totalEarningsToday.toFixed(2)}`, color: "from-red-500/10 border-red-500/20" },
            { label: "THIS WEEK", value: `$${stats.totalEarningsWeek.toFixed(2)}`, color: "from-blue-500/10 border-blue-500/20" },
            { label: "THIS MONTH", value: `$${stats.totalEarningsMonth.toFixed(2)}`, color: "from-emerald-500/10 border-emerald-500/20" },
            { label: "ACTIVE", value: `${stats.activeAgentsCount}/${stats.totalAgentsDeployed}`, color: "from-amber-500/10 border-amber-500/20" },
            { label: "DEPLOYED", value: stats.totalAgentsDeployed, color: "from-purple-500/10 border-purple-500/20" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} border rounded-lg p-4 backdrop-blur-sm hover:bg-opacity-100 transition-all`}>
              <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${idx === 0 ? "text-red-400" : idx === 1 ? "text-blue-400" : idx === 2 ? "text-emerald-400" : idx === 3 ? "text-amber-400" : "text-purple-400"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
            <p className="text-xs text-gray-500 mt-1">Earnings</p>
          </div>

          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">THIS WEEK</p>
            <p className="text-xl font-bold text-white">${stats.totalEarningsWeek.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Earnings</p>
          </div>

          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">THIS MONTH</p>
            <p className="text-xl font-bold text-white">${stats.totalEarningsMonth.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Earnings</p>
          </div>

          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">ACTIVE</p>
            <p className="text-xl font-bold text-green-400">{stats.activeAgentsCount}</p>
            <p className="text-xs text-gray-500 mt-1">of {stats.totalAgentsDeployed}</p>
          </div>

          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">DEPLOYED</p>
            <p className="text-xl font-bold text-accent">{stats.totalAgentsDeployed}</p>
            <p className="text-xs text-gray-500 mt-1">Agents</p>
          </div>
        </div>
      </div>
    </div>
  )
}
