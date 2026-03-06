"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PoolDetectionResult {
  hasV4Pool: boolean
  hasV3Pool: boolean
  v4PoolKey?: any
  v3PoolFee?: number
  v4Liquidity?: string
  v3Liquidity?: string
  detectionTime?: number
  error?: string
}

export function MMV4PoolDetector() {
  const [tokenAddress, setTokenAddress] = useState("")
  const [detection, setDetection] = useState<PoolDetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDetect = async () => {
    if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid Ethereum address")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/agents/mm/v4-support/detect-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAddress }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Detection failed")
        return
      }

      setDetection(data.detection)
      console.log("[V4 Pool Detector] Results:", data)
    } catch (err: any) {
      setError(err.message || "Detection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-slate-900 border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-white">Uniswap V4 Pool Detection</h3>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter token address (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
          <Button onClick={handleDetect} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Detecting..." : "Detect"}
          </Button>
        </div>

        {error && <Alert className="bg-red-900 border-red-700"><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}

        {detection && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-300">V4 Pool:</span>
              <Badge className={detection.hasV4Pool ? "bg-green-600" : "bg-gray-600"}>
                {detection.hasV4Pool ? "Found" : "Not Found"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-300">V3 Pool:</span>
              <Badge className={detection.hasV3Pool ? "bg-blue-600" : "bg-gray-600"}>
                {detection.hasV3Pool ? "Found" : "Not Found"}
              </Badge>
            </div>

            {detection.hasV4Pool && detection.v4PoolKey && (
              <div className="bg-slate-800 p-3 rounded text-sm text-gray-300 space-y-1">
                <p>
                  <span className="font-semibold">Fee:</span> {detection.v4PoolKey.fee / 10000}%
                </p>
                <p>
                  <span className="font-semibold">Tick Spacing:</span> {detection.v4PoolKey.tickSpacing}
                </p>
                <p>
                  <span className="font-semibold">Hooks:</span> {detection.v4PoolKey.hooks}
                </p>
                {detection.v4Liquidity && (
                  <p>
                    <span className="font-semibold">Liquidity:</span> {detection.v4Liquidity}
                  </p>
                )}
              </div>
            )}

            {detection.hasV3Pool && (
              <div className="bg-slate-800 p-3 rounded text-sm text-gray-300">
                <p>
                  <span className="font-semibold">V3 Fee Tier:</span> {detection.v3PoolFee! / 10000}%
                </p>
              </div>
            )}

            {detection.detectionTime && (
              <p className="text-xs text-gray-500">Detection took {detection.detectionTime}ms</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
