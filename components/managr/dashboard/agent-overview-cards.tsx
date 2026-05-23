"use client"

import { Activity, TrendingUp, Music, Zap, Rocket } from "lucide-react"
import Link from "next/link"

interface Agent {
  type: "auto-stream" | "market-maker" | "autonomous-artist" | "investment" | "boost"
  id: string
  name: string
  isActive: boolean
  status: "active" | "inactive" | "error"
  earnings: number
  recentActivityCount: number
  lastActivityAt: string | null
}

interface AgentOverviewCardsProps {
  agents: Agent[]
}

const AGENT_CONFIG = {
  "auto-stream": {
    icon: Activity,
    color: "from-blue-500/20 to-blue-900/20",
    label: "Auto-Stream",
    description: "Autonomous streaming agent",
    href: "/dashboard/agent/auto-stream",
  },
  "market-maker": {
    icon: TrendingUp,
    color: "from-green-500/20 to-green-900/20",
    label: "Market Maker",
    description: "Trading automation agent",
    href: "/dashboard/agent/mm",
  },
  "autonomous-artist": {
    icon: Music,
    color: "from-purple-500/20 to-purple-900/20",
    label: "Autonomous Artist",
    description: "AI music generation agent",
    href: "/dashboard/agent/autonomous-artist",
  },
  investment: {
    icon: Zap,
    color: "from-yellow-500/20 to-yellow-900/20",
    label: "Investment Agent",
    description: "Token investment agent",
    href: "/dashboard/agent/investment",
  },
  boost: {
    icon: Rocket,
    color: "from-red-500/20 to-red-900/20",
    label: "Boost",
    description: "Trading boost campaign",
    href: "/dashboard/agent/boost",
  },
}

export function AgentOverviewCards({ agents }: AgentOverviewCardsProps) {
  const groupedAgents = agents.reduce(
    (acc, agent) => {
      if (!acc[agent.type]) {
        acc[agent.type] = []
      }
      acc[agent.type].push(agent)
      return acc
    },
    {} as Record<string, Agent[]>
  )

  const agentTypes: Array<"auto-stream" | "market-maker" | "autonomous-artist" | "investment" | "boost"> = [
    "auto-stream",
    "market-maker",
    "autonomous-artist",
    "investment",
    "boost",
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {agentTypes.map((type) => {
        const config = AGENT_CONFIG[type]
        const Icon = config.icon
        const typeAgents = groupedAgents[type] || []
        const isDeployed = typeAgents.length > 0
        const isActive = typeAgents.some((a) => a.isActive)
        const totalEarnings = typeAgents.reduce((sum, a) => sum + a.earnings, 0)

        return (
          <Link
            key={type}
            href={isDeployed ? config.href : "/managr"}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br p-1 transition hover:shadow-lg hover:shadow-red-500/20"
          >
            <div
              className={`relative h-full rounded-lg bg-gradient-to-br ${config.color} p-6 transition-all group-hover:bg-opacity-75 border border-gray-700/50 group-hover:border-gray-600/50`}
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${isActive ? "text-green-400" : "text-gray-500"}`} />
                <div
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}
                />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-lg mb-1">{config.label}</h3>
              <p className="text-xs text-gray-400 mb-4">{config.description}</p>

              {/* Status */}
              {isDeployed ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Deployed:</span>
                    <span className="text-sm font-semibold text-accent">{typeAgents.length}</span>
                  </div>
                  {isActive && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Active:</span>
                      <span className="text-sm font-semibold text-green-400">
                        {typeAgents.filter((a) => a.isActive).length}
                      </span>
                    </div>
                  )}
                  {totalEarnings > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                      <span className="text-xs text-gray-400">Earnings:</span>
                      <span className="text-sm font-semibold text-white">${totalEarnings.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">Not deployed</p>
                  <p className="text-xs text-accent mt-2 group-hover:underline">Deploy now →</p>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
