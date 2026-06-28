"use client"

import { formatDistanceToNow } from "date-fns"
import { Music, TrendingUp, Zap, Activity, ArrowUpRight } from "lucide-react"

interface Activity {
  id: string
  type: string
  agentType: string
  description: string
  amount: number | null
  timestamp: string
}

interface AgentActivityTableProps {
  activities: Activity[]
}

const AGENT_TYPE_CONFIG = {
  "auto-stream": { icon: Activity, color: "text-blue-400", label: "Auto-Stream" },
  "market-maker": { icon: TrendingUp, color: "text-green-400", label: "Market Maker" },
  "autonomous-artist": { icon: Music, color: "text-purple-400", label: "Artist AI" },
  investment: { icon: Zap, color: "text-yellow-400", label: "Investment" },
  boost: { icon: ArrowUpRight, color: "text-red-400", label: "Boost" },
}

export function AgentActivityTable({ activities }: AgentActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg bg-gray-900/40 border border-gray-700/50 p-12 text-center">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No recent activity from your agents yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50 bg-gray-900/60">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Agent Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {activities.map((activity) => {
              const agentConfig =
                AGENT_TYPE_CONFIG[activity.agentType as keyof typeof AGENT_TYPE_CONFIG] ||
                AGENT_TYPE_CONFIG["auto-stream"]
              const Icon = agentConfig.icon

              return (
                <tr key={activity.id} className="hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${agentConfig.color}`} />
                      <span className="text-sm font-medium text-white">{agentConfig.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">{activity.description}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {activity.amount !== null && activity.amount !== 0 ? (
                      <span className={`text-sm font-semibold ${activity.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {activity.amount > 0 ? "+" : ""}${activity.amount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
