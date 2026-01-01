"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react"

interface Action {
  id: string
  action_type: string
  target: string
  status: string
  created_at: string
  completed_at?: string
  result?: string
  error?: string
}

export function AgentActivityFeed({ agentId }: { agentId: string }) {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActions()
    const interval = setInterval(loadActions, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [agentId])

  const loadActions = async () => {
    try {
      const response = await fetch(`/api/eliza/agents/${agentId}/actions?limit=20`)
      if (response.ok) {
        const data = await response.json()
        setActions(data.actions)
      }
    } catch (error) {
      console.error("Failed to load actions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "executing":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "executing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border">
      <h3 className="text-lg font-bold font-mono mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Activity Feed
      </h3>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">No activity yet</div>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(action.status)}
                    <span className="font-mono text-sm font-semibold">{action.action_type.replace("_", " ")}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs font-mono ${getStatusColor(action.status)}`}>
                    {action.status}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground font-mono mb-1">Target: {action.target}</div>

                <div className="text-xs text-muted-foreground font-mono">
                  {new Date(action.created_at).toLocaleString()}
                </div>

                {action.error && <div className="text-xs text-red-500 font-mono mt-2">Error: {action.error}</div>}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
