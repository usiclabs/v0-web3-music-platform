"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Radio,
  Zap,
  DollarSign,
  Eye,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MMAgentConfig {
  id: string
  wallet_address: string
  owner_address: string
  is_active: boolean
  buy_amount_eth: string
  buy_interval_minutes: number
  sell_interval_minutes: number
  last_buy_at: string | null
  last_sell_at: string | null
  total_volume_generated: string
  multi_wallet_mode: boolean
  active_wallets: number
  pro_mode?: boolean
}

interface MMStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: string
  usiBalance: string
}

interface WalletData {
  id: string
  wallet_index: number
  wallet_address: string
  eth_balance: number
  token_balance: number
  total_buys: number
  total_sells: number
  is_active: boolean
}

interface MMActivity {
  id: string
  activity_type: string
  description: string
  metadata?: any
  created_at: string
  wallet_address?: string
}

function TerminalBorder({
  children,
  title,
  status,
}: { children: React.ReactNode; title: string; status?: "active" | "standby" | "error" }) {
  return (
    <div className="relative border border-accent/30 bg-black/40 backdrop-blur-sm rounded-none">
      <div className="absolute -top-3 left-4 px-2 bg-black flex items-center gap-2">
        <span className="text-xs font-mono text-accent uppercase tracking-wider">{title}</span>
        {status && (
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              status === "active" ? "bg-emerald-500" : status === "error" ? "bg-rose-500" : "bg-amber-500"
            }`}
          />
        )}
      </div>
      {children}
    </div>
  )
}

function WalletFeed({ wallet, agentId }: { wallet: WalletData; agentId: string }) {
  const health = wallet.eth_balance > 0.001 ? "active" : wallet.eth_balance > 0.0001 ? "standby" : "error"

  return (
    <TerminalBorder title={`WALLET_${wallet.wallet_index.toString().padStart(2, "0")}`} status={health}>
      <div className="p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-accent">STATUS</span>
          <Badge
            variant="outline"
            className={`
            ${
              health === "active"
                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                : health === "standby"
                  ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                  : "border-rose-500/50 text-rose-400 bg-rose-500/10"
            }
          `}
          >
            {health.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between">
            <span className="text-gray-500">ETH_BAL</span>
            <span className="text-emerald-400">{wallet.eth_balance.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">$USI_BAL</span>
            <span className="text-accent">{wallet.token_balance.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded">
            <div className="text-gray-500 text-[10px]">BUYS</div>
            <div className="text-emerald-400 font-bold text-base">{wallet.total_buys}</div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded">
            <div className="text-gray-500 text-[10px]">SELLS</div>
            <div className="text-rose-400 font-bold text-base">{wallet.total_sells}</div>
          </div>
        </div>

        <div className="text-[10px] text-gray-600 truncate pt-2 border-t border-white/10">{wallet.wallet_address}</div>
      </div>
    </TerminalBorder>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes("buy")) {
    return <TrendingUp className="w-3 h-3 text-emerald-400" />
  }
  if (type.includes("sell")) {
    return <TrendingDown className="w-3 h-3 text-rose-400" />
  }
  if (type.includes("error") || type.includes("failed")) {
    return <XCircle className="w-3 h-3 text-rose-400" />
  }
  if (type.includes("completed")) {
    return <CheckCircle2 className="w-3 h-3 text-emerald-400" />
  }
  return <Activity className="w-3 h-3 text-blue-400" />
}

export default function MMCommandCenter() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const [activities, setActivities] = useState<MMActivity[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { data: configData } = useSWR<{ config: MMAgentConfig }>(
    address ? `/api/agents/mm/config?ownerAddress=${address}` : null,
    (url) => fetch(url).then((res) => res.json()),
  )

  const config = configData?.config

  const { data: statsData } = useSWR<{ stats: MMStats }>(
    config?.id ? `/api/agents/mm/stats?agentId=${config.id}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { refreshInterval: 10000 },
  )

  const { data: walletsData } = useSWR<{ wallets: WalletData[] }>(
    config?.id ? `/api/agents/mm/wallets?agentId=${config.id}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { refreshInterval: 10000 },
  )

  useEffect(() => {
    if (!config?.id) return

    const loadActivities = async () => {
      const response = await fetch(`/api/agents/mm/activities?agentId=${config.id}`)
      const data = await response.json()
      if (data.activities) {
        setActivities(data.activities)
      }
    }

    loadActivities()

    const supabase = createClient()
    const channel = supabase
      .channel("mm_agent_activity")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mm_agent_activity",
          filter: `agent_id=eq.${config.id}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as MMActivity, ...prev].slice(0, 50))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [config?.id])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <TerminalBorder title="ACCESS_DENIED" status="error">
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <p className="font-mono text-sm text-gray-400">WALLET_CONNECTION_REQUIRED</p>
            <Button
              onClick={() => router.push("/dashboard/agent/mm")}
              variant="outline"
              className="border-accent/30 text-accent hover:bg-accent/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              RETURN_TO_DASHBOARD
            </Button>
          </div>
        </TerminalBorder>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <TerminalBorder title="LOADING" status="standby">
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-sm text-gray-400">INITIALIZING_COMMAND_CENTER</p>
          </div>
        </TerminalBorder>
      </div>
    )
  }

  const stats = statsData?.stats
  const wallets = walletsData?.wallets || []
  const totalOperations = (stats?.totalBuys || 0) + (stats?.totalSells || 0)
  const successRate = totalOperations > 0 ? (((stats?.totalBuys || 0) / totalOperations) * 100).toFixed(1) : "0"

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 font-mono">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/dashboard/agent/mm")}
            variant="ghost"
            size="sm"
            className="text-accent hover:text-accent/80 hover:bg-accent/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            EXIT_CC
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-accent tracking-wider">MM_COMMAND_CENTER</h1>
            <p className="text-xs text-gray-500 mt-1">MARKET_MAKER_PROTOCOL_V1.0</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">SYSTEM_TIME</div>
          <div className="text-sm text-accent tabular-nums">
            {currentTime.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="text-[10px] text-gray-600">
            {currentTime.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Current Operator */}
        <div className="lg:col-span-4">
          <TerminalBorder title="CURRENT_OPERATOR" status={config.is_active ? "active" : "standby"}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/80 to-accent flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">OPERATOR_ID</div>
                  <div className="text-sm text-white font-bold truncate">
                    {config.owner_address.slice(0, 8)}...{config.owner_address.slice(-6)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                <div>
                  <div className="text-gray-500">MODE</div>
                  <div className="text-emerald-400 font-bold">
                    {config.multi_wallet_mode ? (config.pro_mode ? "PRO" : "MULTI") : "SINGLE"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">WALLETS</div>
                  <div className="text-accent font-bold">{config.active_wallets}</div>
                </div>
                <div>
                  <div className="text-gray-500">BUY_INT</div>
                  <div className="text-blue-400 font-bold">{config.buy_interval_minutes}m</div>
                </div>
                <div>
                  <div className="text-gray-500">SELL_INT</div>
                  <div className="text-amber-400 font-bold">{config.sell_interval_minutes}m</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <div className="text-[10px] text-gray-500 mb-1">BUY_AMOUNT</div>
                <div className="text-sm text-white font-bold">{config.buy_amount_eth} ETH</div>
              </div>
            </div>
          </TerminalBorder>
        </div>

        {/* Global Metrics */}
        <div className="lg:col-span-8">
          <TerminalBorder title="GLOBAL_METRICS" status={config.is_active ? "active" : "standby"}>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-500">TOTAL_BUYS</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 tabular-nums">{stats?.totalBuys || 0}</div>
                  <div className="text-[10px] text-gray-600">
                    {(((stats?.totalBuys || 0) / Math.max(totalOperations, 1)) * 100).toFixed(0)}% OF OPERATIONS
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-gray-500">TOTAL_SELLS</span>
                  </div>
                  <div className="text-3xl font-bold text-rose-400 tabular-nums">{stats?.totalSells || 0}</div>
                  <div className="text-[10px] text-gray-600">
                    {(((stats?.totalSells || 0) / Math.max(totalOperations, 1)) * 100).toFixed(0)}% OF OPERATIONS
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="text-xs text-gray-500">$USI_HOLDINGS</span>
                  </div>
                  <div className="text-3xl font-bold text-accent tabular-nums">
                    {Number.parseFloat(stats?.usiBalance || "0").toFixed(0)}
                  </div>
                  <div className="text-[10px] text-gray-600">CURRENT POSITION</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-gray-500">VOLUME_GEN</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-400 tabular-nums">
                    {Number.parseFloat(config.total_volume_generated || "0").toFixed(3)}
                  </div>
                  <div className="text-[10px] text-gray-600">ETH TOTAL VOLUME</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent" />
                  <span className="text-xs text-gray-500">AGENT_STATUS</span>
                </div>
                <Badge
                  variant="outline"
                  className={`
                  ${
                    config.is_active
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                      : "border-gray-500/50 text-gray-400 bg-gray-500/10"
                  }
                `}
                >
                  {config.is_active ? "OPERATIONAL" : "STANDBY"}
                </Badge>
              </div>
            </div>
          </TerminalBorder>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Wallet Feeds */}
        <div className="lg:col-span-8">
          <TerminalBorder title="WALLET_SURVEILLANCE" status="active">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {wallets.map((wallet) => (
                  <WalletFeed key={wallet.id} wallet={wallet} agentId={config.id} />
                ))}
              </div>

              {wallets.length === 0 && (
                <div className="text-center py-12 text-gray-600 text-sm">NO_ACTIVE_WALLETS_DETECTED</div>
              )}
            </div>
          </TerminalBorder>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-4">
          <TerminalBorder title="SURVEILLANCE_LOG" status="active">
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-2">
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 text-xs">NO_ACTIVITY_RECORDED</div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white/5 border border-white/10 p-2.5 rounded hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <ActivityIcon type={activity.activity_type} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {activity.activity_type.replace(/_/g, "_")}
                            </span>
                            <span className="text-[10px] text-gray-600 tabular-nums">
                              {new Date(activity.created_at).toLocaleTimeString("en-US", {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">{activity.description}</p>
                          {activity.wallet_address && (
                            <p className="text-[10px] text-gray-600 font-mono truncate">{activity.wallet_address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TerminalBorder>
        </div>
      </div>
    </div>
  )
}
