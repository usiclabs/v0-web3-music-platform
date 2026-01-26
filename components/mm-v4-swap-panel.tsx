"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface V4SwapPanelProps {
  agentId: string
  ownerAddress: string
  tokenAddress: string
  walletIndex?: number
}

export function MMV4SwapPanel({ agentId, ownerAddress, tokenAddress, walletIndex = 1 }: V4SwapPanelProps) {
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
      const response = await fetch("/api/agents/mm/v4-support/swap", {
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
        setError(data.error || "Swap failed")
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
    <Card className="p-6 bg-slate-900 border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-white">V4 Swap Execution</h3>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Amount (ETH)"
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
          <Button onClick={handleSwap} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Swapping..." : "Swap"}
          </Button>
        </div>

        {error && <Alert className="bg-red-900 border-red-700"><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}

        {success && result && (
          <Alert className="bg-green-900 border-green-700">
            <AlertDescription className="text-green-200">
              <p className="font-semibold">Swap Successful!</p>
              <p className="text-sm mt-2">
                TX: <code className="bg-black/30 px-2 py-1 rounded">{result.txHash?.slice(0, 10)}...</code>
              </p>
              {result.amountOut && (
                <p className="text-sm">
                  Received: <span className="font-semibold">{Number(result.amountOut).toFixed(6)} tokens</span>
                </p>
              )}

              {result.poolConfiguration && (
                <div className="mt-3 text-xs space-y-1">
                  <p>Pool Fee: {result.poolConfiguration.fee / 10000}%</p>
                  <p>Tick Spacing: {result.poolConfiguration.tickSpacing}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  )
}
