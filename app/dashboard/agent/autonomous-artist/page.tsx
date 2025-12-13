"use client"

import { Textarea } from "@/components/ui/textarea"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Music,
  Loader2,
  Settings,
  Activity,
  Radio,
  Mic2,
  CheckCircle2,
  XCircle,
  Save,
  DollarSign,
  Clock,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"

interface AutonomousArtistConfig {
  id: string
  artist_name: string
  is_active: boolean
  total_budget: number
  spent_amount: number
  daily_limit: number
  generation_interval_hours: number
  auto_list_on_platform: boolean
  music_styles: string[]
  preferred_genres: string[]
  album_art_prompt: string
  last_generated_at: string | null
}

interface GeneratedTrack {
  id: string
  title: string
  description: string
  audio_url: string
  image_url: string
  duration: number
  created_at: string
  listed_on_platform: boolean
  listed_at: string | null
  transaction_hash: string | null
}

interface ActivityLog {
  id: string
  activity_type: string
  description: string
  created_at: string
  metadata: Record<string, any>
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

export default function AutonomousArtistPage() {
  const { address, isConnected } = useWallet()
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [agentWallet, setAgentWallet] = useState<{ address: string; usdcBalance: number; ethBalance: number } | null>(
    null,
  )
  const [fundAmount, setFundAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [config, setConfig] = useState<AutonomousArtistConfig>({
    id: "",
    artist_name: "Autonomous Artist",
    is_active: false,
    total_budget: 100,
    spent_amount: 0,
    daily_limit: 10,
    generation_interval_hours: 24,
    auto_list_on_platform: true,
    music_styles: ["Electronic", "Ambient"],
    preferred_genres: ["Electronic", "Synth-pop"],
    album_art_prompt: "Futuristic, neon colors, abstract shapes",
    last_generated_at: null,
  })

  const { data: configData, error: configError } = useSWR(
    isConnected ? `/api/agents/autonomous-artist?address=${address}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { revalidateOnFocus: false },
  )

  const { data: tracksData } = useSWR(
    config.id ? `/api/agents/autonomous-artist/${config.id}/tracks` : null,
    (url) => fetch(url).then((res) => res.json()),
    { revalidateOnFocus: false },
  )

  const { data: activityData } = useSWR(
    config.id ? `/api/agents/autonomous-artist/${config.id}/activity` : null,
    (url) => fetch(url).then((res) => res.json()),
    { revalidateOnFocus: false },
  )

  const { data: walletData } = useSWR(
    config.id ? `/api/agents/wallet?agentId=${config.id}&address=${address}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    if (configData?.agent) {
      setConfig(configData.agent)
    }
  }, [configData])

  useEffect(() => {
    if (walletData?.data) {
      setAgentWallet(walletData.data)
    }
  }, [walletData])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Connect your wallet to access the Autonomous Artist Agent
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config.id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Autonomous Artist Agent</h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Create music automatically, pay for generations with X402, and list tracks on MyUSIC 24/7
              </p>
              <Button
                size="lg"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  toast.promise(
                    fetch("/api/agents/autonomous-artist/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ownerAddress: address }),
                    }).then(async (res) => {
                      if (!res.ok) throw new Error("Failed to create agent")
                      const data = await res.json()
                      setConfig(data.agent)
                      return data
                    }),
                    {
                      loading: "Creating your Autonomous Artist...",
                      success: "Autonomous Artist Agent created!",
                      error: "Failed to create agent",
                    },
                  )
                }}
              >
                <Music className="w-4 h-4" />
                Create Autonomous Artist
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const tracks = tracksData?.tracks || []
  const activity = activityData?.activity || []
  const remainingBudget = (config.total_budget || 0) - (config.spent_amount || 0)
  const budgetUsedPercent = ((config.spent_amount || 0) / (config.total_budget || 1)) * 100

  const handleToggleAgent = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/agents/autonomous-artist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: config.id, isActive: !config.is_active }),
      })
      if (!res.ok) throw new Error("Failed to toggle agent")
      const data = await res.json()
      setConfig(data.agent)
      toast.success(config.is_active ? "Agent paused" : "Agent activated")
    } catch (error) {
      toast.error("Failed to toggle agent")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunGeneration = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/agents/autonomous-artist/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: config.id, address }),
      })
      if (!res.ok) throw new Error("Generation failed")
      await mutate(`/api/agents/autonomous-artist/${config.id}/tracks`)
      await mutate(`/api/agents/autonomous-artist/${config.id}/activity`)
      toast.success("Song generated and listed on platform!")
    } catch (error) {
      toast.error("Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/agents/autonomous-artist/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: config.id, ...config }),
      })
      if (!res.ok) throw new Error("Failed to save config")
      toast.success("Configuration saved!")
    } catch (error) {
      toast.error("Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-emerald-500/10 bg-gradient-to-r from-card/80 via-emerald-500/5 to-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse"
                  style={{ animationDuration: "3s" }}
                >
                  <Music className="w-7 h-7 text-white" />
                </div>
                {config.is_active && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                    <LivePulse active />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{config.artist_name}</h1>
                  {config.is_active && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <Radio className="w-3 h-3 mr-1" />
                      Composing
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Autonomous Music Generation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunGeneration}
                disabled={isGenerating || !config.is_active || !agentWallet}
                className="gap-2 bg-transparent border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                Generate Now
              </Button>

              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-emerald-500/10 shadow-sm">
                <span className="text-sm font-medium text-muted-foreground">Agent</span>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={handleToggleAgent}
                  disabled={isSaving}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <div
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${config.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}
                >
                  {config.is_active ? "Active" : "Paused"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Wallet Status */}
        {agentWallet ? (
          <Card className="mb-6 border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Agent Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="font-mono text-sm truncate">{agentWallet.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">USDC Balance</p>
                  <p className="font-bold text-lg">${agentWallet.usdcBalance}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remaining Budget</p>
                  <p className="font-bold text-lg text-emerald-500">${remainingBudget.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Budget Usage</p>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${budgetUsedPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{budgetUsedPercent.toFixed(1)}% used</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue="tracks" className="space-y-4">
          <TabsList className="bg-card/50 border border-emerald-500/10">
            <TabsTrigger
              value="tracks"
              className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
            >
              <Music className="w-4 h-4" />
              Catalog
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
            >
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
            >
              <Settings className="w-4 h-4" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-4">
            {tracks.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-12 pb-12 text-center">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    No tracks generated yet. Click "Generate Now" to create your first song!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tracks.map((track: GeneratedTrack) => (
                  <Card key={track.id} className="border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {track.image_url && (
                          <img
                            src={track.image_url || "/placeholder.svg"}
                            alt={track.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{track.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{track.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {track.listed_on_platform && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Listed
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {new Date(track.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                          {track.audio_url && (
                            <audio controls className="w-full max-w-md" controlsList="nodownload">
                              <source src={track.audio_url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            {activity.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="pt-12 pb-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No activity yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activity.map((log: ActivityLog) => (
                  <Card key={log.id} className="border-0 shadow-sm">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{log.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        {log.activity_type === "generation_success" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1" />
                        )}
                        {log.activity_type === "generation_error" && <XCircle className="w-4 h-4 text-red-500 mt-1" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-emerald-500" />
                  Artist Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="artist_name" className="text-sm">
                    Artist Name
                  </Label>
                  <Input
                    id="artist_name"
                    value={config.artist_name}
                    onChange={(e) => setConfig({ ...config, artist_name: e.target.value })}
                    className="bg-background/50 border-emerald-500/20 focus:border-emerald-500/40 mt-1"
                    placeholder="Your artist name"
                  />
                </div>
                <div>
                  <Label htmlFor="album_art_prompt" className="text-sm">
                    Album Art Style
                  </Label>
                  <Textarea
                    id="album_art_prompt"
                    value={config.album_art_prompt}
                    onChange={(e) => setConfig({ ...config, album_art_prompt: e.target.value })}
                    className="bg-background/50 border-emerald-500/20 focus:border-emerald-500/40 mt-1"
                    placeholder="Describe the visual style for generated album art"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Generation Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="generation_interval" className="text-sm">
                    Generate Every (hours)
                  </Label>
                  <Input
                    id="generation_interval"
                    type="number"
                    min="1"
                    max="168"
                    value={config.generation_interval_hours}
                    onChange={(e) =>
                      setConfig({ ...config, generation_interval_hours: Number.parseInt(e.target.value) })
                    }
                    className="bg-background/50 border-emerald-500/20 focus:border-emerald-500/40 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="daily_limit" className="text-sm">
                    Daily Generation Limit
                  </Label>
                  <Input
                    id="daily_limit"
                    type="number"
                    min="1"
                    value={config.daily_limit}
                    onChange={(e) => setConfig({ ...config, daily_limit: Number.parseInt(e.target.value) })}
                    className="bg-background/50 border-emerald-500/20 focus:border-emerald-500/40 mt-1"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Switch
                    checked={config.auto_list_on_platform}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_list_on_platform: checked })}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <Label className="text-sm cursor-pointer">Auto-list generated tracks on platform</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Budget Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="total_budget" className="text-sm">
                    Total Budget (USDC)
                  </Label>
                  <Input
                    id="total_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.total_budget}
                    onChange={(e) => setConfig({ ...config, total_budget: Number.parseFloat(e.target.value) })}
                    className="bg-background/50 border-emerald-500/20 focus:border-emerald-500/40 mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
