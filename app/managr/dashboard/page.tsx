"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { DashboardHeader } from "@/components/managr/dashboard/header"
import { AgentOverviewCards } from "@/components/managr/dashboard/agent-overview-cards"
import { UnifiedStatsPanel } from "@/components/managr/dashboard/unified-stats-panel"
import { AgentActivityTable } from "@/components/managr/dashboard/agent-activity-table"
import { ConnectWalletPrompt } from "@/components/managr/dashboard/connect-wallet-prompt"
import { Spinner } from "@/components/ui/spinner"

interface DashboardData {
  musician: {
    address: string
    name: string
    avatarUrl: string | null
  }
  agents: Array<{
    type: "auto-stream" | "market-maker" | "autonomous-artist" | "investment" | "boost"
    id: string
    name: string
    isActive: boolean
    status: "active" | "inactive" | "error"
    earnings: number
    recentActivityCount: number
    lastActivityAt: string | null
  }>
  stats: {
    totalEarningsToday: number
    totalEarningsWeek: number
    totalEarningsMonth: number
    activeAgentsCount: number
    totalAgentsDeployed: number
  }
  recentActivity: Array<{
    id: string
    type: string
    agentType: string
    description: string
    amount: number | null
    timestamp: string
  }>
}

export default function ManagRDashboard() {
  const { address: userAddress, isConnected } = useAccount()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !userAddress) {
      setLoading(false)
      setDashboard(null)
      return
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/managr/dashboard?address=${userAddress}`)

        if (!response.ok) {
          throw new Error("Failed to load dashboard data")
        }

        const data = await response.json()
        setDashboard(data)
      } catch (err: any) {
        console.error("[v0] Dashboard fetch error:", err)
        setError(err.message || "Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()

    // Refresh dashboard every 30 seconds
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [isConnected, userAddress])

  if (!isConnected || !userAddress) {
    return <ConnectWalletPrompt />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8" />
          <p className="text-gray-400">Loading your MANAGR dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">No Agents Deployed Yet</h2>
            <p className="text-gray-400 mb-6">Deploy your first agent to get started with MANAGR</p>
            <a
              href="/managr"
              className="inline-block px-6 py-3 bg-red-500/80 hover:bg-red-600 text-white font-semibold rounded-lg transition"
            >
              Learn About MANAGR
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <DashboardHeader musician={dashboard.musician} stats={dashboard.stats} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Agent Overview Cards */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Your Agent Team</h2>
            <AgentOverviewCards agents={dashboard.agents} />
          </div>

          {/* Unified Stats */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Performance Metrics</h2>
            <UnifiedStatsPanel stats={dashboard.stats} />
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <AgentActivityTable activities={dashboard.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}
