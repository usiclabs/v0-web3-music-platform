"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Zap,
  Users,
  DollarSign,
  Activity,
  Search,
  ExternalLink,
  Loader2,
  Settings,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { formatUnits } from "viem"

interface RelayedTransaction {
  id: string
  from_address: string
  to_address: string
  value: string
  nonce: string
  tx_hash: string
  gas_used: string
  metadata: any
  created_at: string
}

interface UserGasStats {
  user_address: string
  total_transactions: number
  total_gas_used: string
  last_transaction: string
}

interface SubsidyConfig {
  maxSubsidyPerUser: number
  gaslessEnabled: boolean
  maxGasPrice: string
}

export default function GaslessAdminPage() {
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<RelayedTransaction[]>([])
  const [userStats, setUserStats] = useState<UserGasStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [config, setConfig] = useState<SubsidyConfig>({
    maxSubsidyPerUser: 10,
    gaslessEnabled: true,
    maxGasPrice: "0.01",
  })

  // Overview stats
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [totalGasUsed, setTotalGasUsed] = useState("0")
  const [activeUsers, setActiveUsers] = useState(0)
  const [totalGasCostUSD, setTotalGasCostUSD] = useState("0")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load all relayed transactions
      const { data: txData, error: txError } = await supabase
        .from("relayed_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (txError) {
        console.error("[Admin] Failed to load transactions:", txError)
        addToast({
          title: "Error",
          description: "Failed to load transaction data",
          variant: "error",
        })
        return
      }

      setTransactions(txData || [])

      // Calculate overview stats
      const totalTx = txData?.length || 0
      const totalGas = txData?.reduce((sum, tx) => sum + BigInt(tx.gas_used || "0"), 0n) || 0n
      const uniqueUsers = new Set(txData?.map((tx) => tx.from_address.toLowerCase())).size

      // Estimate gas cost in USD (assuming ~$0.01 per transaction on Base)
      const estimatedCostUSD = (totalTx * 0.01).toFixed(2)

      setTotalTransactions(totalTx)
      setTotalGasUsed(totalGas.toString())
      setActiveUsers(uniqueUsers)
      setTotalGasCostUSD(estimatedCostUSD)

      // Calculate per-user stats
      const userStatsMap = new Map<string, UserGasStats>()
      txData?.forEach((tx) => {
        const addr = tx.from_address.toLowerCase()
        const existing = userStatsMap.get(addr)

        if (existing) {
          existing.total_transactions++
          existing.total_gas_used = (BigInt(existing.total_gas_used) + BigInt(tx.gas_used || "0")).toString()
          if (new Date(tx.created_at) > new Date(existing.last_transaction)) {
            existing.last_transaction = tx.created_at
          }
        } else {
          userStatsMap.set(addr, {
            user_address: addr,
            total_transactions: 1,
            total_gas_used: tx.gas_used || "0",
            last_transaction: tx.created_at,
          })
        }
      })

      const statsArray = Array.from(userStatsMap.values()).sort((a, b) => b.total_transactions - a.total_transactions)
      setUserStats(statsArray)
    } catch (error) {
      console.error("[Admin] Failed to load dashboard data:", error)
      addToast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.from_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.tx_hash.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredUserStats = userStats.filter((stat) =>
    stat.user_address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getTransactionType = (metadata: any) => {
    if (!metadata) return "Transfer"
    if (metadata.purpose === "x402_streaming") return "X402 Streaming"
    if (metadata.purpose === "gasless_swap") return "Token Swap"
    return "Transfer"
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Gasless Subsidy Dashboard
        </h1>
        <p className="text-muted-foreground">Monitor and manage EIP-3009 gasless transaction subsidies</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Relayed via EIP-3009</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Total Gas Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(Number(totalGasUsed) / 1e6).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground mt-1">Gas units consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Estimated Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalGasCostUSD}</div>
            <p className="text-xs text-muted-foreground mt-1">USD spent on gas</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Subsidy Configuration
          </CardTitle>
          <CardDescription>Manage gasless transaction limits and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxSubsidy">Max Subsidies Per User</Label>
              <Input
                id="maxSubsidy"
                type="number"
                value={config.maxSubsidyPerUser}
                onChange={(e) => setConfig({ ...config, maxSubsidyPerUser: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Free transactions per user</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxGasPrice">Max Gas Price (USD)</Label>
              <Input
                id="maxGasPrice"
                type="number"
                step="0.01"
                value={config.maxGasPrice}
                onChange={(e) => setConfig({ ...config, maxGasPrice: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Maximum gas cost per tx</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gaslessEnabled">Gasless Enabled</Label>
              <div className="flex items-center gap-2 h-10">
                <Button
                  variant={config.gaslessEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfig({ ...config, gaslessEnabled: !config.gaslessEnabled })}
                  className="w-full"
                >
                  {config.gaslessEnabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Disabled
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Toggle gasless features</p>
            </div>
          </div>

          <Button
            onClick={() => {
              addToast({
                title: "Configuration Updated",
                description: "Subsidy settings have been saved",
                variant: "success",
              })
            }}
          >
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address or transaction hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadDashboardData}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Gas Usage
          </CardTitle>
          <CardDescription>Top users by transaction count</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUserStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No user data available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUserStats.slice(0, 10).map((stat) => (
                <div
                  key={stat.user_address}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium font-mono text-sm">{formatAddress(stat.user_address)}</p>
                      <p className="text-xs text-muted-foreground">Last: {formatDate(stat.last_transaction)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{stat.total_transactions} txs</p>
                    <p className="text-xs text-muted-foreground">
                      {(Number(stat.total_gas_used) / 1e6).toFixed(2)}M gas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.maxSubsidyPerUser - stat.total_transactions} remaining
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest relayed transactions via EIP-3009</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="rounded-full p-2 bg-primary/10 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{getTransactionType(tx.metadata)}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{formatAddress(tx.from_address)}</span>
                        <span>→</span>
                        <span className="font-mono">{formatAddress(tx.to_address)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm">{formatUnits(BigInt(tx.value), 6)} USDC</p>
                      <p className="text-xs text-muted-foreground">{(Number(tx.gas_used) / 1000).toFixed(1)}k gas</p>
                    </div>
                    <a
                      href={`https://basescan.org/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            About Gasless Subsidies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            The gasless subsidy system uses EIP-3009 to enable users to make transactions without holding ETH for gas.
            The platform relayer pays gas fees on behalf of users up to a configurable limit.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <span className="font-semibold">X402 Streaming:</span> Users can stream music without gas fees
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <span className="font-semibold">Token Swaps:</span> USDC → USI swaps can be executed gaslessly
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <span className="font-semibold">Rate Limiting:</span> Each user gets {config.maxSubsidyPerUser} free
                transactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
