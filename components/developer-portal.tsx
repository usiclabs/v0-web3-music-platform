'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, TrendingUp, DollarSign, Activity, Star, Code, Copy, Check, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { RegisterAgentDialog } from '@/components/register-agent-dialog'
import { RegisterBuilderCodeDialog } from '@/components/register-builder-code-dialog'

interface DeveloperPortalProps {
  agents: any[]
  builderCodes: any[]
  earnings: any[]
  userAddress: string
}

export function DeveloperPortal({
  agents,
  builderCodes,
  earnings,
  userAddress,
}: DeveloperPortalProps) {
  const [showAgentDialog, setShowAgentDialog] = useState(false)
  const [showBuilderCodeDialog, setShowBuilderCodeDialog] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { toast } = useToast()

  const totalEarnings = builderCodes.reduce(
    (sum, code) => sum + Number(code.total_earnings || 0),
    0
  )

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast({
      title: 'Copied!',
      description: 'Builder code copied to clipboard',
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-balance mb-2">
          Developer <span className="text-[#FF5733]">Portal</span>
        </h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Manage your AI agents and builder codes, track earnings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-[#FF5733]" />
            <span className="text-sm text-muted-foreground">Active Agents</span>
          </div>
          <p className="text-3xl font-bold">{agents.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Code className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Builder Codes</span>
          </div>
          <p className="text-3xl font-bold">{builderCodes.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Total Volume</span>
          </div>
          <p className="text-3xl font-bold">
            $
            {builderCodes
              .reduce((sum, code) => sum + Number(code.total_volume || 0), 0)
              .toFixed(2)}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="builder-codes">Builder Codes</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your AI Agents</h2>
            <Button onClick={() => setShowAgentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Register Agent
            </Button>
          </div>

          {agents.length === 0 ? (
            <Card className="p-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
              <p className="text-muted-foreground mb-4">
                Register your first AI agent to start earning revenue
              </p>
              <Button onClick={() => setShowAgentDialog(true)}>
                Register Agent
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                    </div>
                    {agent.is_active ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {agent.agent_reputation?.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {agent.total_actions?.toLocaleString() || 0} actions
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {agent.agent_reputation?.total_feedback_count || 0} reviews
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={`/agents/${agent.agent_address}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Public Page
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder-codes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your Builder Codes</h2>
            <Button onClick={() => setShowBuilderCodeDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Register Code
            </Button>
          </div>

          {builderCodes.length === 0 ? (
            <Card className="p-12 text-center">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No builder codes yet</h3>
              <p className="text-muted-foreground mb-4">
                Register a builder code to earn from activity generated by your apps
              </p>
              <Button onClick={() => setShowBuilderCodeDialog(true)}>
                Register Builder Code
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {builderCodes.map((code) => (
                <Card key={code.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{code.name}</h3>
                        {code.verified && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Verified
                          </Badge>
                        )}
                        {!code.is_active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {code.description}
                      </p>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 w-fit">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <code className="font-mono font-medium">{code.code}</code>
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="ml-2 hover:bg-muted rounded p-1 transition-colors"
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-600">
                          ${Number(code.total_earnings || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Earnings</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-semibold">
                          {code.total_transactions?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Recent Earnings</h2>

          {earnings.length === 0 ? (
            <Card className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
              <p className="text-muted-foreground">
                Your agents will start earning once they generate activity
              </p>
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {earnings.map((earning) => (
                  <div key={earning.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {earning.source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Agent: {earning.agent_address.slice(0, 8)}...</span>
                        {earning.builder_code && (
                          <Badge variant="outline" className="text-xs">
                            {earning.builder_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +${Number(earning.amount).toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <RegisterAgentDialog
        open={showAgentDialog}
        onOpenChange={setShowAgentDialog}
        userAddress={userAddress}
      />
      <RegisterBuilderCodeDialog
        open={showBuilderCodeDialog}
        onOpenChange={setShowBuilderCodeDialog}
        userAddress={userAddress}
      />
    </div>
  )
}
