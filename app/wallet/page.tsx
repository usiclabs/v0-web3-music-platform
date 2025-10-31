"use client"

import { useState } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { formatUnits } from "viem"
import { usePublicClient } from "wagmi"
import { USDC_ADDRESS, USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { Copy, ExternalLink, WalletIcon, TrendingUp, Music, DollarSign } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

interface Stream {
  id: string
  track_id: string
  total_paid: string
  chunks_played: number
  started_at: string
  last_played_at: string
  tracks: {
    title: string
    artist_id: string
    cover_url: string
  }
}

export default function WalletPage() {
  const { address, isConnected } = useWallet()
  const publicClient = usePublicClient()
  const [copied, setCopied] = useState(false)

  // Fetch token balances
  const { data: balances, isLoading: balancesLoading } = useSWR(
    address ? ["wallet-balances", address] : null,
    async () => {
      if (!publicClient || !address) return null

      const chainId = await publicClient.getChainId()

      const [usdcBalance, usiBalance] = await Promise.all([
        publicClient.readContract({
          address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS],
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS],
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
      ])

      return {
        usdc: formatUnits(usdcBalance as bigint, 6),
        usi: formatUnits(usiBalance as bigint, 18),
      }
    },
    { refreshInterval: 10000 },
  )

  // Fetch payment history
  const { data: streams, isLoading: streamsLoading } = useSWR(
    address ? ["wallet-streams", address] : null,
    async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase
        .from("streams")
        .select(
          `
          id,
          track_id,
          total_paid,
          chunks_played,
          started_at,
          last_played_at,
          tracks (
            title,
            artist_id,
            cover_url
          )
        `,
        )
        .eq("listener_address", address?.toLowerCase())
        .order("last_played_at", { ascending: false })
        .limit(20)

      if (error) throw error
      return data as Stream[]
    },
  )

  const { data: songTokens, isLoading: tokensLoading } = useSWR(
    address && publicClient ? ["wallet-song-tokens", address] : null,
    async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Get all tracks with coin addresses
      const { data: tracks, error } = await supabase
        .from("tracks")
        .select("id, title, artist_id, cover_url, coin_address")
        .not("coin_address", "is", null)

      if (error) throw error
      if (!tracks || tracks.length === 0) return []

      console.log("[v0] Checking balances for", tracks.length, "tokenized tracks")

      // Check on-chain balance for each token
      const tokensWithBalances = await Promise.all(
        tracks.map(async (track) => {
          try {
            const balance = await publicClient!.readContract({
              address: track.coin_address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            })

            const balanceFormatted = formatUnits(balance as bigint, 18)
            const balanceNum = Number.parseFloat(balanceFormatted)

            console.log("[v0] Token balance for", track.title, ":", balanceFormatted)

            return {
              ...track,
              balance: balanceFormatted,
              balanceNum,
            }
          } catch (error) {
            console.error("[v0] Failed to fetch balance for", track.title, error)
            return {
              ...track,
              balance: "0",
              balanceNum: 0,
            }
          }
        }),
      )

      // Filter out tokens with zero balance
      const ownedTokens = tokensWithBalances.filter((token) => token.balanceNum > 0)

      console.log("[v0] User owns", ownedTokens.length, "out of", tracks.length, "tokenized tracks")

      return ownedTokens
    },
    { refreshInterval: 30000 }, // Refresh every 30 seconds
  )

  const { data: portfolioValue, isLoading: portfolioLoading } = useSWR(
    songTokens && songTokens.length > 0 ? ["wallet-portfolio-value", songTokens] : null,
    async () => {
      if (!songTokens || songTokens.length === 0) return 0

      let totalValue = 0

      for (const token of songTokens) {
        try {
          const res = await fetch(`/api/token/metrics/${token.coin_address}`)
          if (res.ok) {
            const metrics = await res.json()
            if (metrics.price > 0) {
              const tokenValue = token.balanceNum * metrics.price
              totalValue += tokenValue
            }
          }
        } catch (error) {
          console.error("[v0] Failed to fetch price for token:", token.title, error)
        }
      }

      return totalValue
    },
    { refreshInterval: 60000 }, // Refresh every minute
  )

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const totalSpent = streams?.reduce((sum, stream) => sum + Number.parseFloat(stream.total_paid || "0"), 0) || 0

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <WalletIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your balances, payment history, and collected song tokens.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Connect Wallet
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <WalletIcon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Wallet</h1>
              <p className="text-muted-foreground">Manage your tokens and view transaction history</p>
            </div>
          </div>

          {/* Wallet Address */}
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{address?.slice(2, 4).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                  <p className="font-mono text-sm sm:text-base truncate">{address}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">{copied ? "Copied!" : "Copy"}</span>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Token Balances */}
        <div>
          <h2 className="text-xl font-bold mb-4">Token Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Portfolio Value */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
                <span className="text-xs font-medium text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full">
                  PORTFOLIO
                </span>
              </div>
              {portfolioLoading || tokensLoading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <p className="text-3xl font-bold mb-1">${portfolioValue ? portfolioValue.toFixed(2) : "0.00"}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Token Value</p>
            </Card>

            {/* USDC Balance */}
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">USDC</span>
              </div>
              {balancesLoading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <p className="text-3xl font-bold mb-1">{Number.parseFloat(balances?.usdc || "0").toFixed(2)}</p>
              )}
              <p className="text-sm text-muted-foreground">USD Coin</p>
            </Card>

            {/* USI Balance */}
            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">$USI</span>
              </div>
              {balancesLoading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <p className="text-3xl font-bold mb-1">
                  {Number.parseFloat(balances?.usi || "0").toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
              <p className="text-sm text-muted-foreground">USIC Token</p>
            </Card>

            {/* Total Spent */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Music className="h-6 w-6 text-blue-500" />
                </div>
                <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">SPENT</span>
              </div>
              {streamsLoading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <p className="text-3xl font-bold mb-1">${totalSpent.toFixed(2)}</p>
              )}
              <p className="text-sm text-muted-foreground">Total on Streams</p>
            </Card>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-xl font-bold mb-4">Payment History</h2>
          <Card className="overflow-hidden">
            {streamsLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : streams && streams.length > 0 ? (
              <div className="divide-y divide-border">
                {streams.map((stream) => (
                  <Link
                    key={stream.id}
                    href={`/track/${stream.track_id}`}
                    className="flex items-center gap-4 p-4 hover:bg-accent/5 transition-colors"
                  >
                    <img
                      src={stream.tracks.cover_url || "/placeholder.svg?height=48&width=48"}
                      alt={stream.tracks.title}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{stream.tracks.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {stream.chunks_played} chunks played • {new Date(stream.last_played_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">${Number.parseFloat(stream.total_paid).toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">USDC</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No payment history yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start streaming music to see your payment history here
                </p>
                <Button asChild>
                  <Link href="/explore">Explore Music</Link>
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Collected Song Tokens */}
        <div>
          <h2 className="text-xl font-bold mb-4">Collected Song Tokens</h2>
          {tokensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="aspect-square w-full rounded mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </Card>
              ))}
            </div>
          ) : songTokens && songTokens.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {songTokens.map((token: any) => (
                <Link key={token.id} href={`/track/${token.id}`}>
                  <Card className="p-4 hover:border-accent/50 transition-all group">
                    <div className="aspect-square w-full rounded overflow-hidden mb-3 bg-accent/5 relative">
                      <img
                        src={token.cover_url || "/placeholder.svg?height=200&width=200"}
                        alt={token.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                        {Number.parseFloat(token.balance).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                    <p className="font-medium text-sm truncate mb-1">{token.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{formatAddress(token.artist_id)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No song tokens collected yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Collect song tokens by supporting your favorite artists
              </p>
              <Button asChild>
                <Link href="/tokens">Discover Tokenized Music</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
