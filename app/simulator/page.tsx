"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Activity, Bot, Music, TrendingUp, Zap, Terminal, Play, Pause, Settings } from "lucide-react"
import { AgentActivityFeed } from "@/components/eliza/agent-activity-feed"

export default function SimulatorPage() {
  const { address, isConnected } = useAccount()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const [agentName, setAgentName] = useState("")
  const [agentBio, setAgentBio] = useState("")
  const [capabilities, setCapabilities] = useState({
    music_creation: true,
    token_trading: true,
    social_interaction: false,
  })

  const [networkStats, setNetworkStats] = useState({
    totalSongs: 0,
    totalTrades: 0,
    networkPower: 0,
  })

  useEffect(() => {
    if (address) {
      loadAgents()
    }
  }, [address])

  const loadAgents = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/eliza/agents/list?ownerAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)

        // Calculate network stats
        const totalActions = data.agents.reduce((sum: number, agent: any) => sum + (agent.stats?.totalActions || 0), 0)
        setNetworkStats({
          totalSongs: data.agents.filter((a: any) => a.capabilities.includes("music_creation")).length * 3, // Estimate
          totalTrades: data.agents.filter((a: any) => a.capabilities.includes("token_trading")).length * 5, // Estimate
          networkPower: totalActions,
        })
      }
    } catch (error) {
      console.error("Failed to load agents:", error)
    }
  }

  const createAgent = async () => {
    if (!address || !agentName) return

    setLoading(true)
    try {
      const response = await fetch("/api/eliza/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          name: agentName,
          bio: agentBio || "An autonomous music agent",
          personality: ["creative", "analytical", "adaptive"],
          capabilities: Object.keys(capabilities).filter((k) => capabilities[k as keyof typeof capabilities]),
        }),
      })

      if (response.ok) {
        await loadAgents()
        setShowCreateModal(false)
        setAgentName("")
        setAgentBio("")
      }
    } catch (error) {
      console.error("Failed to create agent:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAgent = async (agentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/eliza/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        await loadAgents()
      }
    } catch (error) {
      console.error("Failed to toggle agent:", error)
    }
  }

  const runAgentCycle = async (agentId: string) => {
    try {
      await fetch(`/api/eliza/agents/${agentId}/cycle`, {
        method: "POST",
      })
      await loadAgents()
    } catch (error) {
      console.error("Failed to run agent cycle:", error)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center">
          <Terminal className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Agent Simulator</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to deploy autonomous music agents</p>
          <w3m-button />
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold font-mono">AGENT SIMULATOR</h1>
                <p className="text-sm text-muted-foreground font-mono">Autonomous Music Intelligence Network</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              <Bot className="w-4 h-4 mr-2" />
              Deploy Agent
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-mono">ACTIVE AGENTS</span>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold font-mono">{agents.filter((a) => a.is_active).length}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">{agents.length} total deployed</div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-mono">SONGS CREATED</span>
              <Music className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold font-mono">{networkStats.totalSongs}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Autonomous generations</div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-mono">TRADES EXECUTED</span>
              <TrendingUp className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold font-mono">{networkStats.totalTrades}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Autonomous swaps</div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-mono">NETWORK POWER</span>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold font-mono">{networkStats.networkPower}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Total actions</div>
          </Card>
        </div>

        {/* Agent Grid or Empty State */}
        {agents.length === 0 ? (
          <Card className="p-12 text-center bg-card/30 backdrop-blur">
            <Terminal className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2 font-mono">No Agents Deployed</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto font-mono text-sm">
              Deploy your first autonomous agent to start creating music and trading tokens on the network
            </p>
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              <Bot className="w-4 h-4 mr-2" />
              Deploy First Agent
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Agent Cards */}
            <div className="lg:col-span-2">
              <div className="grid md:grid-cols-2 gap-6">
                {agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary transition-all cursor-pointer"
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold font-mono">{agent.name}</h3>
                          <Badge variant={agent.is_active ? "default" : "secondary"} className="text-xs font-mono mt-1">
                            {agent.is_active ? "ACTIVE" : "OFFLINE"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 font-mono line-clamp-2">{agent.bio}</p>

                    <div className="flex gap-2 flex-wrap mb-4">
                      {agent.capabilities.map((cap: string) => (
                        <Badge key={cap} variant="outline" className="text-xs font-mono">
                          {cap.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-muted-foreground font-mono text-xs">ACTIONS</div>
                        <div className="font-bold font-mono">{agent.stats?.totalActions || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-mono text-xs">MEMORY</div>
                        <div className="font-bold font-mono">{agent.stats?.memorySize || 0} MB</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={agent.is_active ? "destructive" : "default"}
                        className="flex-1 font-mono"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleAgent(agent.id, agent.is_active)
                        }}
                      >
                        {agent.is_active ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                        {agent.is_active ? "Stop" : "Start"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          runAgentCycle(agent.id)
                        }}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              {selectedAgent ? (
                <AgentActivityFeed agentId={selectedAgent} />
              ) : (
                <Card className="p-6 bg-card/50 backdrop-blur border-border">
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground font-mono">Select an agent to view activity</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6 bg-card border-border">
            <h2 className="text-2xl font-bold mb-6 font-mono">Deploy New Agent</h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="font-mono">Agent Name</Label>
                <Input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="MusicBot Alpha"
                  className="font-mono"
                />
              </div>

              <div>
                <Label className="font-mono">Bio</Label>
                <Input
                  value={agentBio}
                  onChange={(e) => setAgentBio(e.target.value)}
                  placeholder="An autonomous music creation and trading agent"
                  className="font-mono"
                />
              </div>

              <div>
                <Label className="mb-3 block font-mono">Capabilities</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilities.music_creation}
                      onCheckedChange={(checked) => setCapabilities({ ...capabilities, music_creation: !!checked })}
                    />
                    <label className="text-sm font-mono">Music Creation</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilities.token_trading}
                      onCheckedChange={(checked) => setCapabilities({ ...capabilities, token_trading: !!checked })}
                    />
                    <label className="text-sm font-mono">Token Trading</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilities.social_interaction}
                      onCheckedChange={(checked) => setCapabilities({ ...capabilities, social_interaction: !!checked })}
                    />
                    <label className="text-sm font-mono">Social Interaction</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1 font-mono"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={createAgent} className="flex-1 font-mono" disabled={loading || !agentName}>
                {loading ? "Deploying..." : "Deploy Agent"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
