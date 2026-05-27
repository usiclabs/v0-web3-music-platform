"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UnifiedSwapPanelProps {
  agentId: string
  ownerAddress: string
  tokenAddress: string
  walletIndex?: number
  defaultVersion?: "v3" | "v4"
}

export function MMUnifiedSwapPanel({
  agentId,
  ownerAddress,
  tokenAddress,
  walletIndex = 1,
  defaultVersion = "v3",
}: UnifiedSwapPanelProps) {
  const [version, setVersion] = useState<"v3" | "v4">(defaultVersion)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleSwap = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError("Enter valid amount")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const endpoint = version === "v4" ? "/api/agents/mm/v4-support/swap" : "/api/agents/mm/v3-swap"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          tokenAddress,
          amount,
          walletIndex,
          ownerAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Swap failed on ${version.toUpperCase()}`)
        return
      }

      setSuccess(true)
      setResult(data)
      setAmount("")
    } catch (err: any) {
      setError(err.message || "Swap error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Unified Swap Execution</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Pool Version:</span>
          <Tabs value={version} onValueChange={(v) => setVersion(v as "v3" | "v4")} className="w-auto">
            <TabsList className="grid w-auto grid-cols-2 h-7">
              <TabsTrigger value="v3" className="text-xs">
                V3
              </TabsTrigger>
              <TabsTrigger value="v4" className="text-xs">
                V4
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
          <p className="text-xs text-muted-foreground mb-2">
            {version === "v4"
              ? "Using Uniswap V4 with hook support, flash accounting, and dynamic fees"
              : "Using Uniswap V3 with concentrated liquidity and fixed fee tiers"}
          </p>
          <p className="text-xs text-muted-foreground/70 mb-3">
            {version === "v4"
              ? "V4 supports custom hooks, singleton PoolManager, and ERC-6909 token accounting. Price limits protect against extreme slippage."
              : "V3 uses capital-efficient concentrated liquidity ranges with oracle data."}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Amount (ETH)"
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleSwap}
              disabled={loading || !amount}
              className={
                version === "v4"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {loading ? `Swapping on ${version.toUpperCase()}...` : `Swap on ${version.toUpperCase()}`}
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-900/20 border-red-500/30">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && result && (
          <Alert className="bg-green-900/20 border-green-500/30">
            <AlertDescription className="text-green-400">
              <p className="font-semibold mb-2">
                {version === "v4" ? "V4 Swap Successful!" : "V3 Swap Successful!"}
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  TX:{" "}
                  <code className="bg-black/30 px-2 py-1 rounded text-xs break-all">
                    {result.txHash}
                  </code>
                </p>
                {result.amountOut && (
                  <p>
                    Received: <span className="font-semibold">{Number(result.amountOut).toFixed(6)}</span> tokens
                  </p>
                )}

                {result.poolConfiguration && (
                  <div className="mt-2 p-2 bg-black/20 rounded text-xs space-y-1">
                    <p className="font-semibold text-green-300 mb-1">Pool Configuration:</p>
                    <p>
                      Pool Fee: <span className="font-mono">{result.poolConfiguration.fee / 10000}%</span>
                    </p>
                    {version === "v4" && (
                      <>
                        <p>
                          Tick Spacing:{" "}
                          <span className="font-mono">{result.poolConfiguration.tickSpacing}</span>
                        </p>
                        <p>
                          Hooks:{" "}
                          <span className="font-mono text-xs break-all">
                            {result.poolConfiguration.hooks === "0x0000000000000000000000000000000000000000"
                              ? "None (standard pool)"
                              : result.poolConfiguration.hooks}
                          </span>
                        </p>
                        {result.poolConfiguration.liquidity && (
                          <p>
                            Liquidity:{" "}
                            <span className="font-mono">{result.poolConfiguration.liquidity}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  )
}
