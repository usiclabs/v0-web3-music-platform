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
    <div className="border-b border-red-500/20 bg-gradient-to-b from-red-900/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/managr" className="text-gray-400 hover:text-white transition">
            ← Back to MANAGR
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">CONNECTED WALLET</p>
            <p className="font-mono text-sm text-gray-300">{musician.address.slice(0, 10)}...</p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold font-display mb-2 text-balance">
            Welcome back,
            <span className="text-accent ml-2">{musician.name}</span>
          </h1>
          <p className="text-gray-400">Manage your autonomous music agent team</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">TODAY</p>
            <p className="text-xl font-bold text-accent">${stats.totalEarningsToday.toFixed(2)}</p>
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
