"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Shield, Star, Zap, Activity } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Agent {
  id: string
  agent_address: string
  name: string
  description: string
  version: string
  capabilities: string[]
  owner_address: string
  total_actions: number
  created_at: string
  feedback_count: number
  average_rating: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error("[v0] Error loading agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAgentColor = (index: number) => {
    const colors = [
      "from-violet-500 to-fuchsia-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-pink-500 to-rose-500",
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 mb-4">
          <Bot className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold">AI Agents</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trustless AI agents powered by ERC-8004 for automated music curation and operations
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Shield className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verified Identity</h3>
          <p className="text-muted-foreground">All agents have on-chain identities registered via ERC-8004 NFTs</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Star className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reputation System</h3>
          <p className="text-muted-foreground">
            Transparent feedback and ratings ensure agent quality and trustworthiness
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Zap className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Validated Actions</h3>
          <p className="text-muted-foreground">Independent validators verify agent operations for added security</p>
        </Card>
      </div>

      {/* Agents List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Available Agents</h2>
          <Link href="/agents/register">
            <Button>
              <Bot className="h-4 w-4 mr-2" />
              Register Agent
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <Card className="p-12 text-center">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No agents registered yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to register an AI agent on the platform</p>
            <Link href="/agents/register">
              <Button>Register First Agent</Button>
            </Link>
          </Card>
        ) : (
          agents.map((agent, index) => (
            <Card key={agent.id} className="p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className={`bg-gradient-to-br ${getAgentColor(index)}`}>
                      <Bot className="h-8 w-8 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{agent.name}</h3>
                      <Badge variant="outline">{agent.version}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{agent.description}</p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {agent.capabilities.slice(0, 4).map((cap, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{agent.capabilities.length - 4} more
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">
                          {agent.average_rating > 0 ? agent.average_rating.toFixed(1) : "New"}
                        </span>
                        {agent.feedback_count > 0 && (
                          <span className="text-muted-foreground">({agent.feedback_count})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>{agent.total_actions.toLocaleString()} actions</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Link href={`/agents/${agent.agent_address}`}>
                  <Button>View Details</Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
