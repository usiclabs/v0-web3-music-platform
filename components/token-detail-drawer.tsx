"use client"

import { useState, useEffect, useRef } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ExternalLink, Activity, Droplets, Copy, Check, Loader2, AlertCircle } from "lucide-react"
import { usePublicClient } from "wagmi"
import { formatUnits } from "viem"
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
} from "@/lib/web3/contracts"

interface TokenDetailDrawerProps {
  token: {
    id: string
    title: string
    artist_name: string
    cover_url: string
    coin_address: string
    created_at: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  metrics?: {
    price: number
    priceChange24h: number
    marketCap: number
    volume24h: number
    liquidity: number
    holders: number
    txns24h: number
  }
}

const WETH_ADDRESS = {
  8453: "0x4200000000000000000000000000000000000006",
  84532: "0x4200000000000000000000000000000000000006",
} as const

const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const tokenDataCache = new Map<
  string,
  {
    poolInfo: { address: string; fee: number } | null
    currentPrice: string | null
    totalSupply: string | null
    poolLiquidity: string | null
    timestamp: number
  }
>()

const CACHE_DURATION = 30000 // 30 seconds cache

export function TokenDetailDrawer({ token, open, onOpenChange, metrics }: TokenDetailDrawerProps) {
  const { chainId } = useWallet()
  const publicClient = usePublicClient()
  const [copied, setCopied] = useState(false)
  const [poolInfo, setPoolInfo] = useState<{ address: string; fee: number } | null>(null)
  const [isLoadingPool, setIsLoadingPool] = useState(true)
  const [currentPrice, setCurrentPrice] = useState<string | null>(null)
  const [totalSupply, setTotalSupply] = useState<string | null>(null)
  const [poolLiquidity, setPoolLiquidity] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!token || !open) return

    // If we have metrics from DexScreener, use them immediately
    if (metrics) {
      console.log("[v0] Using metrics from DexScreener:", metrics)
      setCurrentPrice(metrics.price.toFixed(8))
      setPoolLiquidity(metrics.liquidity.toFixed(4))
      setIsLoadingPool(false)
      setIsLoadingData(false)

      // Still fetch pool info for the address and fee tier
      if (chainId && publicClient) {
        fetchPoolInfo()
      }
      return
    }

    // Otherwise, fetch from blockchain as before
    if (!chainId || !publicClient) return

    // Reset when token changes
    if (hasFetched.current) {
      hasFetched.current = false
    }

    const fetchLiveData = async () => {
      const cacheKey = `${token.coin_address}-${chainId}`
      const cached = tokenDataCache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setPoolInfo(cached.poolInfo)
        setCurrentPrice(cached.currentPrice)
        setTotalSupply(cached.totalSupply)
        setPoolLiquidity(cached.poolLiquidity)
        setIsLoadingPool(false)
        setIsLoadingData(false)
        return
      }

      if (hasFetched.current) return
      hasFetched.current = true

      setIsLoadingPool(true)
      setIsLoadingData(true)
      setError(null)

      try {
        const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]
        const feeTiers = [3000, 500, 10000]

        let foundPool = null
        let foundPrice = null
        let foundLiquidity = null

        for (const fee of feeTiers) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 800))

            const poolAddress = await publicClient.readContract({
              address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
              abi: UNISWAP_V3_FACTORY_ABI,
              functionName: "getPool",
              args: [wethAddress as `0x${string}`, token.coin_address as `0x${string}`, fee],
            })

            if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
              foundPool = { address: poolAddress as string, fee }

              try {
                await new Promise((resolve) => setTimeout(resolve, 800))

                const quoteData = await publicClient.readContract({
                  address: UNISWAP_V3_QUOTER[chainId as keyof typeof UNISWAP_V3_QUOTER] as `0x${string}`,
                  abi: UNISWAP_V3_QUOTER_ABI,
                  functionName: "quoteExactInputSingle",
                  args: [
                    {
                      tokenIn: wethAddress as `0x${string}`,
                      tokenOut: token.coin_address as `0x${string}`,
                      amountIn: BigInt("1000000000000000000"),
                      fee: fee,
                      sqrtPriceLimitX96: 0n,
                    },
                  ],
                })

                if (quoteData && Array.isArray(quoteData) && quoteData[0]) {
                  const tokensPerEth = formatUnits(quoteData[0] as bigint, 18)
                  const priceInEth = 1 / Number.parseFloat(tokensPerEth)
                  foundPrice = priceInEth.toFixed(8)
                }
              } catch (priceError: any) {
                console.error("[v0] Failed to fetch price:", priceError.message)
              }

              try {
                await new Promise((resolve) => setTimeout(resolve, 800))

                const liquidityData = await publicClient.readContract({
                  address: poolAddress as `0x${string}`,
                  abi: UNISWAP_V3_POOL_ABI,
                  functionName: "liquidity",
                })

                if (liquidityData) {
                  foundLiquidity = formatUnits(liquidityData as bigint, 18)
                }
              } catch (liquidityError: any) {
                console.error("[v0] Failed to fetch liquidity:", liquidityError.message)
              }

              break
            }
          } catch (poolError: any) {
            console.error(`[v0] Failed to check pool for fee ${fee}:`, poolError.message)
            if (poolError?.message?.includes("rate limit")) {
              setError("Rate limit reached. Waiting before retrying...")
              await new Promise((resolve) => setTimeout(resolve, 2000))
            }
          }
        }

        setPoolInfo(foundPool)
        setCurrentPrice(foundPrice)
        setPoolLiquidity(foundLiquidity)

        let foundSupply = null
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const supplyData = await publicClient.readContract({
            address: token.coin_address as `0x${string}`,
            abi: [
              {
                inputs: [],
                name: "totalSupply",
                outputs: [{ name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "totalSupply",
          })

          if (supplyData) {
            foundSupply = formatUnits(supplyData as bigint, 18)
          }
        } catch (supplyError: any) {
          console.error("[v0] Failed to fetch total supply:", supplyError.message)
          if (!error) {
            setError("Some data could not be loaded. Token supply unavailable.")
          }
        }

        setTotalSupply(foundSupply)

        tokenDataCache.set(cacheKey, {
          poolInfo: foundPool,
          currentPrice: foundPrice,
          totalSupply: foundSupply,
          poolLiquidity: foundLiquidity,
          timestamp: Date.now(),
        })

        if (foundPool || foundSupply) {
          setError(null)
        }
      } catch (error: any) {
        console.error("[v0] Failed to fetch live data:", error)
        setError("Failed to load token data. Please refresh and try again.")
      } finally {
        setIsLoadingPool(false)
        setIsLoadingData(false)
      }
    }

    fetchLiveData()
  }, [token, chainId, publicClient, open, metrics])

  const fetchPoolInfo = async () => {
    if (!token || !chainId || !publicClient) return

    setIsLoadingPool(true)
    try {
      const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS]
      const feeTiers = [3000, 500, 10000]

      for (const fee of feeTiers) {
        try {
          const poolAddress = await publicClient.readContract({
            address: UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as `0x${string}`,
            abi: UNISWAP_V3_FACTORY_ABI,
            functionName: "getPool",
            args: [wethAddress as `0x${string}`, token.coin_address as `0x${string}`, fee],
          })

          if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
            setPoolInfo({ address: poolAddress as string, fee })
            break
          }
        } catch (error) {
          console.error(`[v0] Failed to check pool for fee ${fee}:`, error)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch pool info:", error)
    } finally {
      setIsLoadingPool(false)
    }
  }

  const copyAddress = () => {
    if (!token) return
    navigator.clipboard.writeText(token.coin_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const marketCap = metrics
    ? (metrics.marketCap / 3500).toFixed(2) // Convert USD to ETH (approximate)
    : currentPrice && totalSupply
      ? (Number.parseFloat(currentPrice) * Number.parseFloat(totalSupply)).toFixed(2)
      : null

  const displayTotalSupply = metrics
    ? (metrics.marketCap / metrics.price).toFixed(0) // Calculate supply from market cap and price
    : totalSupply
      ? Number.parseFloat(totalSupply).toFixed(0)
      : null

  if (!token) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 ring-2 ring-primary/20">
              <img
                src={token.cover_url || "/placeholder.svg?height=64&width=64"}
                alt={token.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl truncate">{token.title}</SheetTitle>
              <SheetDescription className="truncate">{token.artist_name}</SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">{formatAddress(token.coin_address)}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
                <a
                  href={`https://basescan.org/token/${token.coin_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {error && (
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div className="text-sm text-amber-200">{error}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    hasFetched.current = false
                    setError(null)
                    window.location.reload()
                  }}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Current Price</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div>
                    <div className="text-2xl font-bold text-primary">${metrics.price.toFixed(6)}</div>
                    <div className="text-xs text-muted-foreground mt-1">per token</div>
                  </div>
                ) : isLoadingPool ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : currentPrice ? (
                  <div>
                    <div className="text-2xl font-bold text-primary">{currentPrice} ETH</div>
                    <div className="text-xs text-muted-foreground mt-1">per token</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No pool found</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Market Cap</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div>
                    <div className="text-2xl font-bold">${(metrics.marketCap / 1000).toFixed(2)}K</div>
                    <div className="text-xs text-muted-foreground mt-1">estimated value</div>
                  </div>
                ) : isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Calculating...</span>
                  </div>
                ) : marketCap ? (
                  <div>
                    <div className="text-2xl font-bold">{marketCap} ETH</div>
                    <div className="text-xs text-muted-foreground mt-1">estimated value</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Data unavailable</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Total Supply</CardDescription>
              </CardHeader>
              <CardContent>
                {displayTotalSupply ? (
                  <div>
                    <div className="text-2xl font-bold">{Number.parseFloat(displayTotalSupply).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">tokens</div>
                  </div>
                ) : isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Data unavailable</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="liquidity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="liquidity">
                <Droplets className="h-4 w-4 mr-2" />
                Liquidity
              </TabsTrigger>
              <TabsTrigger value="info">
                <Activity className="h-4 w-4 mr-2" />
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="liquidity" className="space-y-4">
              {isLoadingPool ? (
                <Card className="bg-muted/30">
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : poolInfo ? (
                <>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-blue-500" />
                        Uniswap V3 Pool
                      </CardTitle>
                      <CardDescription>Active liquidity pool on Base network</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Pool Address</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {formatAddress(poolInfo.address)}
                            </code>
                            <a
                              href={`https://basescan.org/address/${poolInfo.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Fee Tier</div>
                          <div className="text-lg font-bold text-blue-500">{(poolInfo.fee / 10000).toFixed(2)}%</div>
                        </div>
                      </div>

                      {poolLiquidity && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Pool Liquidity</div>
                          <div className="text-lg font-bold">{Number.parseFloat(poolLiquidity).toFixed(4)} units</div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-blue-500/20">
                        <div className="text-sm text-muted-foreground mb-2">Trading Pair</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">WETH</span>
                            <span className="font-medium">Base Token</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{token.title}</span>
                            <span className="font-medium">Quote Token</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-base">Add Liquidity</CardTitle>
                      <CardDescription>Provide liquidity to earn trading fees</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" asChild>
                        <a
                          href={`https://app.uniswap.org/add/${WETH_ADDRESS[8453]}/${token.coin_address}/${poolInfo.fee}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Add Liquidity on Uniswap
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-muted/30 border-amber-500/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                    <AlertCircle className="h-12 w-12 text-amber-500" />
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">No Liquidity Pool Found</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        This token doesn't have a Uniswap V3 pool yet. Be the first to add liquidity and enable trading!
                      </p>
                    </div>
                    <Button asChild>
                      <a
                        href={`https://app.uniswap.org/add/${WETH_ADDRESS[8453]}/${token.coin_address}/3000`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Create Pool on Uniswap
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Token Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Token Name</span>
                    <span className="font-medium">{token.title}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Artist</span>
                    <span className="font-medium">{token.artist_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Contract Address</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{formatAddress(token.coin_address)}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">Base</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Token Standard</span>
                    <span className="font-medium">ERC-20</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(token.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Market Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Market Cap</span>
                    <span className="font-medium">
                      {metrics ? (
                        `$${(metrics.marketCap / 1000).toFixed(2)}K`
                      ) : isLoadingData ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : marketCap ? (
                        `${marketCap} ETH`
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Total Supply</span>
                    <span className="font-medium">
                      {displayTotalSupply ? (
                        Number.parseFloat(displayTotalSupply).toLocaleString()
                      ) : isLoadingData ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="font-medium">
                      {metrics ? `$${(metrics.volume24h / 1000).toFixed(2)}K` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">24h Transactions</span>
                    <span className="font-medium">{metrics ? metrics.txns24h.toFixed(0) : "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Current Price</span>
                    <span className="font-medium">
                      {metrics ? (
                        `$${metrics.price.toFixed(6)}`
                      ) : isLoadingPool ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : currentPrice ? (
                        `${currentPrice} ETH`
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-between bg-transparent" asChild>
                    <a
                      href={`https://basescan.org/token/${token.coin_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on BaseScan
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-between bg-transparent" asChild>
                    <a
                      href={`https://app.uniswap.org/swap?outputCurrency=${token.coin_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Trade on Uniswap
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-between bg-transparent" asChild>
                    <a
                      href={`https://dexscreener.com/base/${token.coin_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on DexScreener
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
