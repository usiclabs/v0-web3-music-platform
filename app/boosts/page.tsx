"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Zap, PauseCircle, PlayCircle, StopCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BoostsPage() {
  const [boosts, setBoosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadBoosts()
  }, [])

  const loadBoosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/boosts/list", {
        headers: {
          "x-user-address": "0x0", // Would get from auth context
        },
      })

      if (!response.ok) throw new Error("Failed to load boosts")

      const data = await response.json()
      setBoosts(data.boosts || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load boosts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (boosts.length === 0) {
    return (
      <div className="container py-12">
        <div className="text-center space-y-4">
          <Zap className="w-12 h-12 mx-auto opacity-50" />
          <h1 className="text-2xl font-bold">No active boosts</h1>
          <p className="text-muted-foreground">Create a boost on a tokenized artist profile to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Boosts</h1>
        <p className="text-muted-foreground">Manage and track your market maker boosts</p>
      </div>

      <div className="grid gap-4">
        {boosts.map((boost) => (
          <Card key={boost.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{boost.token_symbol}</CardTitle>
                  <CardDescription>
                    Artist: {boost.artist_address.slice(0, 6)}...{boost.artist_address.slice(-4)}
                  </CardDescription>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    boost.status === "active"
                      ? "bg-green-500/10 text-green-700"
                      : boost.status === "paused"
                        ? "bg-yellow-500/10 text-yellow-700"
                        : "bg-red-500/10 text-red-700"
                  }`}
                >
                  {boost.status.charAt(0).toUpperCase() + boost.status.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Initial Funding</p>
                  <p className="text-lg font-semibold">{Number(boost.initial_eth_funding) / 1e18} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-semibold">{Number(boost.current_balance) / 1e18} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net PnL</p>
                  <p className="text-lg font-semibold">
                    {((Number(boost.current_balance) - Number(boost.initial_eth_funding)) / 1e18).toFixed(6)} ETH
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  {boost.status === "active" ? (
                    <>
                      <PauseCircle className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
