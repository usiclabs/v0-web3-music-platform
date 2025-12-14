"use client"

import { useWallet } from "@/lib/web3/wallet-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function BoostsPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const { data: boosts, isLoading } = useSWR(address ? `/api/boosts/list?address=${address}` : null, async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch boosts")
    const data = await res.json()
    return data.boosts
  })

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-foreground/60 mb-6">Connect your wallet to view and manage your boosts</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Go Home
          </Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Your Boosts</h1>
        <p className="text-foreground/60 mb-8">Manage active boosts and track earnings</p>

        {!boosts || boosts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-foreground/60 mb-4">No active boosts yet</p>
            <Link href="/artists">
              <Button>Discover Artists to Boost</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boosts.map((boost) => (
              <Card key={boost.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold">{boost.token_symbol}</p>
                    <p className="text-sm text-foreground/60">Boosted by {boost.boosted_by_address.slice(0, 6)}...</p>
                  </div>
                  <span className="text-sm px-2 py-1 bg-primary/20 text-primary rounded">
                    {boost.is_active ? "Active" : "Ended"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Funding:</span>
                    <span className="font-medium">${boost.initial_usdc_funding.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Current Balance:</span>
                    <span className="font-medium">${boost.current_balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Profit:</span>
                    <span
                      className={
                        boost.total_profit_usdc >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"
                      }
                    >
                      ${boost.total_profit_usdc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Trades:</span>
                    <span className="font-medium">{boost.total_trades}</span>
                  </div>
                </div>

                <Link href={`/boosts/${boost.id}`}>
                  <Button variant="outline" className="w-full bg-transparent">
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
