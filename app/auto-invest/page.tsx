"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Shield,
  Zap,
  Clock,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Info,
  Wallet,
  ArrowRight,
  Activity,
} from "lucide-react"

export default function AutoInvestPage() {
  const { address } = useWallet()
  const [settings, setSettings] = useState<{
    enabled: boolean
    daily_limit: number
    per_track_limit: number
    auto_unlock_full_songs: boolean
  }>({
    enabled: false,
    daily_limit: 10.0,
    per_track_limit: 1.0,
    auto_unlock_full_songs: false,
  })
  const [sessionStatus, setSessionStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (address) {
      loadSettings()
      loadSessionStatus()
    }
  }, [address])

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/auto-investment/settings?userAddress=${address}`)
      if (!response.ok) {
        console.error("Failed to load settings")
        return
      }
      const data = await response.json()
      if (data && typeof data === "object") {
        setSettings({
          enabled: data.enabled ?? false,
          daily_limit: data.daily_limit ?? 10.0,
          per_track_limit: data.per_track_limit ?? 1.0,
          auto_unlock_full_songs: data.auto_unlock_full_songs ?? false,
        })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const loadSessionStatus = async () => {
    try {
      const response = await fetch(`/api/auto-investment/session/status?userAddress=${address}`)
      if (!response.ok) {
        console.error("Failed to load session status")
        return
      }
      const data = await response.json()
      setSessionStatus(data)
    } catch (error) {
      console.error("Failed to load session status:", error)
    }
  }

  const handleSaveSettings = async () => {
    if (!address) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auto-investment/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address, ...settings }),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      setMessage({ type: "success", text: "Settings saved successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!address) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auto-investment/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          spendingLimit: settings.daily_limit,
          maxPerTransaction: settings.per_track_limit,
          validityHours: 24,
        }),
      })

      if (!response.ok) throw new Error("Failed to create session")

      setMessage({ type: "success", text: "Auto-investment session activated!" })
      await loadSessionStatus()
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create session" })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async () => {
    if (!sessionStatus?.sessionKey?.id) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auto-investment/session/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKeyId: sessionStatus.sessionKey.id }),
      })

      if (!response.ok) throw new Error("Failed to revoke session")

      setMessage({ type: "success", text: "Session revoked successfully" })
      await loadSessionStatus()
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to revoke session" })
    } finally {
      setLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
        <div className="container mx-auto px-4 py-16">
          <div
            className={`max-w-2xl mx-auto transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Card className="border-2 border-dashed border-border/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30 animate-bounce-subtle">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Connect Your Wallet</CardTitle>
                <CardDescription className="text-base mt-2">
                  Please connect your wallet to access automated music investment features
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <Button
                  size="lg"
                  className="mt-2 bg-gradient-to-r from-[#e53e3e] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] shadow-lg shadow-[#e53e3e]/30 hover:shadow-xl hover:shadow-[#e53e3e]/40 transition-all duration-300 hover:scale-105"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const spendingPercentage = sessionStatus?.sessionKey
    ? (sessionStatus.sessionKey.spent_amount / sessionStatus.sessionKey.spending_limit) * 100
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e53e3e]/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#dc2626]/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl relative">
        <div
          className={`mb-16 text-center transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-[#e53e3e]/10 via-[#dc2626]/10 to-[#b91c1c]/10 border border-[#e53e3e]/20 rounded-full backdrop-blur-sm shadow-lg shadow-[#e53e3e]/10">
            <Sparkles className="h-5 w-5 text-[#e53e3e] animate-pulse" />
            <span className="text-sm font-semibold bg-gradient-to-r from-[#e53e3e] to-[#dc2626] bg-clip-text text-transparent">
              Automated Music Investment
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent tracking-tight">
            Auto-Invest in Music
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Enable seamless music discovery without signing transactions for every song. Set your budget and let the
            platform automatically unlock tracks as you listen.
          </p>
        </div>

        {message && (
          <div
            className={`mb-8 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <Alert
              className={`border-2 backdrop-blur-sm shadow-lg ${message.type === "error" ? "border-red-500/50 bg-red-500/5 shadow-red-500/10" : "border-green-500/50 bg-green-500/5 shadow-green-500/10"}`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <AlertDescription className="ml-2 font-medium">{message.text}</AlertDescription>
            </Alert>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-muted/30 backdrop-blur-sm border border-border/50">
            <TabsTrigger
              value="overview"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#e53e3e] data-[state=active]:to-[#dc2626] data-[state=active]:text-white transition-all duration-300"
            >
              <Zap className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#e53e3e] data-[state=active]:to-[#dc2626] data-[state=active]:text-white transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-8">
            <div
              className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <Card className="border-2 border-border/50 overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.01]">
                <div
                  className={`h-1.5 w-full ${sessionStatus?.active ? "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" : "bg-gradient-to-r from-muted to-muted/50"}`}
                />
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      {sessionStatus?.active ? (
                        <>
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 animate-glow-pulse">
                            <Unlock className="h-7 w-7 text-white" />
                          </div>
                          <span>Active Session</span>
                        </>
                      ) : (
                        <>
                          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                            <Lock className="h-7 w-7 text-muted-foreground" />
                          </div>
                          <span>No Active Session</span>
                        </>
                      )}
                    </CardTitle>
                    {sessionStatus?.active && (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-600 border-green-500/30 px-4 py-2 text-sm shadow-lg shadow-green-500/20"
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  {sessionStatus?.active ? (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Spending Progress</span>
                          <span className="font-bold text-lg bg-gradient-to-r from-[#e53e3e] to-[#dc2626] bg-clip-text text-transparent">
                            {spendingPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={spendingPercentage} className="h-4 bg-muted/50" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#e53e3e]/20 to-[#dc2626]/20 rounded-full blur-sm" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              ${sessionStatus.sessionKey.spent_amount.toFixed(2)}
                            </span>{" "}
                            spent
                          </span>
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              ${sessionStatus.sessionKey.remaining.toFixed(2)}
                            </span>{" "}
                            remaining
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30">
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">Daily Limit</span>
                          </div>
                          <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            ${sessionStatus.sessionKey.spending_limit.toFixed(2)}
                          </p>
                        </div>
                        <div className="group p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">Per Track</span>
                          </div>
                          <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            ${sessionStatus.sessionKey.max_per_transaction.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#e53e3e]/5 to-[#dc2626]/5 border border-[#e53e3e]/20 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-base font-semibold">Session Expires</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-13">
                          {new Date(sessionStatus.sessionKey.valid_until).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        onClick={handleRevokeSession}
                        variant="destructive"
                        className="w-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? "Revoking..." : "Revoke Session"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="p-12 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-dashed border-border/50 text-center backdrop-blur-sm">
                        <div className="mx-auto mb-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                          <Lock className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-semibold mb-3">No Active Session</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Create a session to enable automatic music unlocking without signing each transaction
                        </p>
                      </div>
                      <Button
                        onClick={handleCreateSession}
                        className="w-full bg-gradient-to-r from-[#e53e3e] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] shadow-lg shadow-[#e53e3e]/30 hover:shadow-xl hover:shadow-[#e53e3e]/40 transition-all duration-300 hover:scale-[1.02]"
                        disabled={loading || !settings.enabled}
                        size="lg"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {loading ? "Activating..." : "Activate Auto-Investment"}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                      {!settings.enabled && (
                        <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                          <Info className="h-4 w-4" />
                          Enable auto-investment in settings first
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Secure Sessions",
                  description: "Temporary authorization with spending limits. Your main wallet stays protected.",
                  color: "text-blue-500",
                  bg: "from-blue-500/10 to-blue-600/5",
                  shadow: "shadow-blue-500/20",
                },
                {
                  icon: DollarSign,
                  title: "Budget Control",
                  description: "Set daily limits and per-track maximums. Never spend more than intended.",
                  color: "text-[#e53e3e]",
                  bg: "from-[#e53e3e]/10 to-[#dc2626]/5",
                  shadow: "shadow-[#e53e3e]/20",
                },
                {
                  icon: Clock,
                  title: "Time-Limited",
                  description: "Sessions expire after 24 hours for security. Renew anytime you need.",
                  color: "text-amber-500",
                  bg: "from-amber-500/10 to-orange-500/5",
                  shadow: "shadow-amber-500/20",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className={`group border-2 border-border/50 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl ${feature.shadow} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${(index + 2) * 100}ms` }}
                >
                  <CardContent className="pt-8 pb-8">
                    <div
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.bg} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <Card className="border-2 border-border/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  Auto-Investment Settings
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Configure your automated music investment preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pb-8">
                <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-dashed border-border/50 hover:border-solid hover:border-[#e53e3e]/30 transition-all duration-300 bg-gradient-to-br from-muted/20 to-transparent backdrop-blur-sm">
                  <div className="space-y-2 flex-1">
                    <Label className="text-lg font-bold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#e53e3e]" />
                      Enable Auto-Investment
                    </Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Automatically unlock tracks without signing each transaction
                    </p>
                  </div>
                  <Switch
                    checked={settings?.enabled ?? false}
                    onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                    className="ml-6 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e53e3e] data-[state=checked]:to-[#dc2626]"
                  />
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="daily-limit" className="text-lg font-bold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      Daily Spending Limit (USDC)
                    </Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings?.daily_limit ?? 10.0}
                      onChange={(e) =>
                        setSettings({ ...settings, daily_limit: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="text-lg h-14 border-2 focus:border-[#e53e3e] transition-all duration-300 bg-muted/30 backdrop-blur-sm"
                    />
                    <p className="text-sm text-muted-foreground flex items-center gap-2 ml-1">
                      <Info className="h-4 w-4" />
                      Maximum amount to spend per day on music
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="per-track-limit" className="text-lg font-bold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center shadow-lg shadow-[#e53e3e]/30">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      Per Track Limit (USDC)
                    </Label>
                    <Input
                      id="per-track-limit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings?.per_track_limit ?? 1.0}
                      onChange={(e) =>
                        setSettings({ ...settings, per_track_limit: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="text-lg h-14 border-2 focus:border-[#e53e3e] transition-all duration-300 bg-muted/30 backdrop-blur-sm"
                    />
                    <p className="text-sm text-muted-foreground flex items-center gap-2 ml-1">
                      <Info className="h-4 w-4" />
                      Maximum amount to spend on a single track
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-dashed border-border/50 hover:border-solid hover:border-[#e53e3e]/30 transition-all duration-300 bg-gradient-to-br from-muted/20 to-transparent backdrop-blur-sm">
                  <div className="space-y-2 flex-1">
                    <Label className="text-lg font-bold">Auto-Unlock Full Songs</Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Unlock entire songs instead of streaming per-chunk
                    </p>
                  </div>
                  <Switch
                    checked={settings?.auto_unlock_full_songs ?? false}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_unlock_full_songs: checked })}
                    className="ml-6 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e53e3e] data-[state=checked]:to-[#dc2626]"
                  />
                </div>

                <Button
                  onClick={handleSaveSettings}
                  className="w-full bg-gradient-to-r from-[#e53e3e] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] shadow-lg shadow-[#e53e3e]/30 hover:shadow-xl hover:shadow-[#e53e3e]/40 transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
