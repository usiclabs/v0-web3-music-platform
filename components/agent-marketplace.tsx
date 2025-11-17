'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Star, TrendingUp, MessageSquare, Activity, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  agent_address: string
  name: string
  description: string
  reputation_score: number
  average_rating: number
  total_feedback_count: number
  total_actions: number
  capabilities: string[]
}

interface AgentMarketplaceProps {
  initialAgents: Agent[]
}

const CAPABILITY_ICONS: Record<string, any> = {
  curation: Sparkles,
  trading: TrendingUp,
  discovery: Search,
  social: MessageSquare,
  analytics: Activity,
}

export function AgentMarketplace({ initialAgents }: AgentMarketplaceProps) {
  const [agents, setAgents] = useState(initialAgents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)

  const allCapabilities = Array.from(
    new Set(agents.flatMap(a => a.capabilities || []))
  )

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCapability = !selectedCapability || 
                              agent.capabilities?.includes(selectedCapability)
    return matchesSearch && matchesCapability
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCapability === null ? 'default' : 'outline'}
            onClick={() => setSelectedCapability(null)}
            size="sm"
          >
            All
          </Button>
          {allCapabilities.map(capability => (
            <Button
              key={capability}
              variant={selectedCapability === capability ? 'default' : 'outline'}
              onClick={() => setSelectedCapability(capability)}
              size="sm"
              className="capitalize"
            >
              {capability}
            </Button>
          ))}
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No agents found matching your criteria</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => {
            const Icon = CAPABILITY_ICONS[agent.capabilities?.[0]] || Activity
            
            return (
              <Link key={agent.agent_address} href={`/agents/${agent.agent_address}`}>
                <Card className="p-6 hover:border-[#FF5733] transition-all duration-200 h-full group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#FF5733]/10 group-hover:bg-[#FF5733]/20 transition-colors">
                        <Icon className="h-5 w-5 text-[#FF5733]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {agent.total_actions.toLocaleString()} actions
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 text-pretty">
                    {agent.description || 'No description available'}
                  </p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {agent.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {agent.total_feedback_count} reviews
                      </span>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(agent.reputation_score)}% trust
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities?.slice(0, 3).map(cap => (
                      <Badge key={cap} variant="outline" className="text-xs capitalize">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 3}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
