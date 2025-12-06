"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Loader2,
  Save,
  Radio,
  BarChart3,
  Zap,
  Timer,
  Wallet,
} from "lucide-react"
import useSWR, { mutate } from "swr"

interface MMAgentConfig {
  id: string
  wallet_address: string
  is_active: boolean
  buy_amount_eth: string
  buy_interval_minutes: number
  sell_interval_minutes: number
  last_buy_at: string | null
  last_sell_at: string | null
  total_volume_generated: string
}

interface MMStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: number
  currentUsiBalance: string
  currentEthBalance: string
}

function LivePulse({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

export default function MMAgentPage() {
  const { address, isConnected } = useWallet()
  const [config, setConfig] = useState<MMAgentConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const { data: configData, isLoading: isLoadingConfig } = useSWR<{ config: MMAgentConfig }>(
    address ? `/api/agents/mm/config?walletAddress=${address}` : null,
    (url) => fetch(url).then((res) => res.json()),
  )

  useEffect(() => {
    if (configData?.config) {
      setConfig(configData.config)
    }
  }, [configData])

  const { data: statsData } = useSWR<{ stats: MMStats }>(
    config?.id ? `/api/agents/mm/stats?agentId=${config.id}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { refreshInterval: 10000 },
  )

  const toggleAgent = async () => {
    if (!config) return

    const newIsActive = !config.is_active
    setConfig({ ...config, is_active: newIsActive })

    try {
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: config.id, is_active: newIsActive }),
      })
      mutate(`/api/agents/mm/config?walletAddress=${address}`)
    } catch (error) {
      console.error("Failed to toggle agent:", error)
      setConfig({ ...config, is_active: !newIsActive })
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          buy_amount_eth: config.buy_amount_eth,
          buy_interval_minutes: config.buy_interval_minutes,
          sell_interval_minutes: config.sell_interval_minutes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }

      mutate(`/api/agents/mm/config?walletAddress=${address}`)
      alert("Configuration saved!")
    } catch (error) {
      console.error("Failed to save config:", error)
      alert("Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunCycle = async () => {
    if (!config) return

    setIsRunning(true)
    try {
      const response = await fetch("/api/agents/mm/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: config.id }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Cycle completed!\n\n${data.messages.join("\n")}`)
        mutate(`/api/agents/mm/stats?agentId=${config.id}`)
      } else {
        alert(`Cycle failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to run cycle:", error)
      alert("Failed to run cycle")
    } finally {
      setIsRunning(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">Connect your wallet to access the Market Maker agent dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingConfig || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = statsData?.stats || {
    totalBuys: 0,
    totalSells: 0,
    volumeGenerated: 0,
    currentUsiBalance: "0",
    currentEthBalance: "0",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-emerald-500/10 bg-gradient-to-r from-card/80 via-emerald-500/5 to-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                {config.is_active && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                    <LivePulse active />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">$USI Market Maker</h1>
                  {config.is_active && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <Radio className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Autonomous Volume Generator</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCycle}
                disabled={isRunning || !config.is_active}
                className="gap-2 bg-transparent"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run Cycle
              </Button>

              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border">
                <span className="text-sm font-medium text-muted-foreground">Agent</span>
                <Switch checked={config.is_active} onCheckedChange={toggleAgent} />
                <div
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    config.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {config.is_active ? "ON" : "OFF"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Buys</p>
                  <p className="text-3xl font-bold">{stats.totalBuys}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Sells</p>
                  <p className="text-3xl font-bold">{stats.totalSells}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Volume Generated</p>
                  <p className="text-3xl font-bold">${stats.volumeGenerated.toFixed(4)}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">$USI Balance</p>
                  <p className="text-3xl font-bold">{Number.parseFloat(stats.currentUsiBalance).toFixed(4)}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Configure your market making parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buy_amount">Buy Amount (ETH)</Label>
                <Input
                  id="buy_amount"
                  type="number"
                  step="0.0001"
                  value={config.buy_amount_eth}
                  onChange={(e) => setConfig({ ...config, buy_amount_eth: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">ETH to spend per buy</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buy_interval">Buy Interval (minutes)</Label>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="buy_interval"
                    type="number"
                    value={config.buy_interval_minutes}
                    onChange={(e) => setConfig({ ...config, buy_interval_minutes: Number.parseInt(e.target.value) })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">How often to buy</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sell_interval">Sell Interval (minutes)</Label>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="sell_interval"
                    type="number"
                    value={config.sell_interval_minutes}
                    onChange={(e) => setConfig({ ...config, sell_interval_minutes: Number.parseInt(e.target.value) })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">How often to sell</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="font-medium">Token Address</p>
                <p className="text-sm text-muted-foreground font-mono">0x987603A52d8B966E10FBD29DcB1A574049E25B07</p>
              </div>
              <Badge>$USI</Badge>
            </div>

            <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">How it works</h3>
                <p className="text-sm text-muted-foreground">
                  This agent automatically buys 0.0001 ETH worth of $USI every 5 minutes and sells accumulated tokens
                  every 10 minutes. This creates consistent trading volume and helps maintain healthy market activity
                  for the $USI ecosystem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
