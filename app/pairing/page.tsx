"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Coins, Sparkles, AlertTriangle, CheckCircle, Copy, ExternalLink, Loader2, Shield, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { USI_TOKEN_ADDRESS } from "@/lib/web3/contracts"

// Admin addresses - only these can access the pairing engine
const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "").split(",").map((addr) => addr.toLowerCase())

interface PairingStep {
  label: string
  description: string
  to: string
  functionName: string
  args: any[]
}

interface PairingResult {
  ok: boolean
  amounts?: {
    newToken: string
    usi: string
    pricePerToken: number
    tokenPerUsi: number
  }
  poolInfo?: {
    token0: string
    token1: string
    fee: number
    sqrtPriceX96: string
  }
  steps?: PairingStep[]
}

export default function PairingPage() {
  const { address, isConnected, connect } = useWallet()
  const { addToast } = useToast()

  // Token Config State
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [totalSupply, setTotalSupply] = useState("1000000")
  const [decimals, setDecimals] = useState("18")
  const [deployMethod, setDeployMethod] = useState<"direct" | "clanker" | "external">("clanker")
  const [deployedTokenAddress, setDeployedTokenAddress] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)

  const [targetMarketCapEth, setTargetMarketCapEth] = useState("10")
  const [feeTier, setFeeTier] = useState("10000") // 1%

  // Pairing Setup State
  const [usiTokenAddress, setUsiTokenAddress] = useState(USI_TOKEN_ADDRESS[8453])
  const [fundingAddress, setFundingAddress] = useState("")
  const [isInitializing, setIsInitializing] = useState(false)
  const [pairingResult, setPairingResult] = useState<PairingResult | null>(null)
  const [showStepsDialog, setShowStepsDialog] = useState(false)

  // Recent Pairings State
  const [recentPairings, setRecentPairings] = useState<any[]>([])
  const [isLoadingPairings, setIsLoadingPairings] = useState(true)

  // Check if user is admin
  const isAdmin = address && ADMIN_ADDRESSES.includes(address.toLowerCase())

  useEffect(() => {
    if (address) {
      setFundingAddress(address)
    }
  }, [address])

  useEffect(() => {
    loadRecentPairings()
  }, [])

  const loadRecentPairings = async () => {
    setIsLoadingPairings(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tracks")
        .select("*, profiles!tracks_artist_id_fkey(artist_name)")
        .not("coin_address", "is", null)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      setRecentPairings(data || [])
    } catch (error) {
      console.error("[Pairing] Failed to load recent pairings:", error)
    } finally {
      setIsLoadingPairings(false)
    }
  }

  const handleDeployToken = async () => {
    if (!address || !tokenName || !tokenSymbol) {
      addToast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "error",
      })
      return
    }

    setIsDeploying(true)
    try {
      const response = await fetch("/api/deploy-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
          decimals: Number(decimals),
          totalSupply: Number(totalSupply),
          method: deployMethod,
          deployerAddress: address,
          ...(deployMethod === "clanker" && {
            targetMarketCapEth: Number(targetMarketCapEth),
            feeTier: Number(feeTier),
          }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed")
      }

      setDeployedTokenAddress(data.tokenAddress)
      addToast({
        title: "Token Deployed!",
        description: `${tokenName} has been deployed successfully${deployMethod === "clanker" ? " with WETH pool" : ""}`,
        variant: "success",
      })
    } catch (error) {
      console.error("[Pairing] Token deployment error:", error)
      addToast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy token",
        variant: "error",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const handleInitializePairing = async () => {
    if (!deployedTokenAddress || !usiTokenAddress || !fundingAddress) {
      addToast({
        title: "Missing Information",
        description: "Please complete token deployment first",
        variant: "error",
      })
      return
    }

    setIsInitializing(true)
    try {
      const response = await fetch("/api/init-pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newToken: deployedTokenAddress,
          usiToken: usiTokenAddress,
          fee: Number(feeTier),
          targetMcUsd: Number(targetMarketCapEth),
          usiPriceUsd: Number(targetMarketCapEth),
          totalSupply: Number(totalSupply),
          adminFundingAddress: fundingAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Pool initialization failed")
      }

      setPairingResult(data)
      setShowStepsDialog(true)
      addToast({
        title: "Pool Configuration Ready",
        description: "Review the steps to complete the pairing",
        variant: "success",
      })
    } catch (error) {
      console.error("[Pairing] Pool initialization error:", error)
      addToast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize pool",
        variant: "error",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({
      title: "Copied!",
      description: "Copied to clipboard",
      variant: "success",
    })
  }

  // Access control
  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5 flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-12 max-w-md text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 border-2 border-destructive/30 mx-auto mb-6">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Admin Access Required</h1>
          <p className="text-muted-foreground mb-8">
            {!isConnected
              ? "Please connect your wallet to access the USI Pairing Engine."
              : "You do not have permission to access this page. This tool is restricted to platform administrators."}
          </p>
          {!isConnected && (
            <Button onClick={connect} className="w-full">
              Connect Wallet
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-black via-black to-primary/5">
      <main className="container py-6 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
                Token Deployment Engine
              </h1>
              <p className="text-sm text-muted-foreground">
                Deploy new tokens with optional automatic WETH pairing via Clanker SDK
              </p>
            </div>
          </div>

          {/* Warning Alert */}
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Admin Tool - Use with Caution
                  </p>
                  <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                    Deploying with Clanker will immediately create an onchain market vs WETH at the configured market
                    cap. Ensure all parameters are correct before proceeding.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Badge */}
        <div className="mb-6">
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-500">
            <Zap className="h-3 w-3 mr-1" />
            Base Network (Chain ID: 8453)
          </Badge>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Token Config */}
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                1. New Token Config
              </CardTitle>
              <CardDescription>Configure and deploy your new ERC20 token</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-name">Token Name *</Label>
                <Input
                  id="token-name"
                  placeholder="My Token"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={isDeploying || !!deployedTokenAddress}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token-symbol">Token Symbol *</Label>
                <Input
                  id="token-symbol"
                  placeholder="MTK"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  disabled={isDeploying || !!deployedTokenAddress}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="total-supply">Total Supply</Label>
                  <Input
                    id="total-supply"
                    type="number"
                    placeholder="1000000"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    disabled={isDeploying || !!deployedTokenAddress}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decimals">Decimals</Label>
                  <Input
                    id="decimals"
                    type="number"
                    placeholder="18"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    disabled={isDeploying || !!deployedTokenAddress}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deploy-method">Deployment Method</Label>
                <Select
                  value={deployMethod}
                  onValueChange={(value: "direct" | "clanker" | "external") => setDeployMethod(value)}
                  disabled={isDeploying || !!deployedTokenAddress}
                >
                  <SelectTrigger id="deploy-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct ERC20 (CDP SDK)</SelectItem>
                    <SelectItem value="clanker">Clanker SDK (with WETH pool)</SelectItem>
                    <SelectItem value="external">External API (manual)</SelectItem>
                  </SelectContent>
                </Select>
                {deployMethod === "direct" && (
                  <p className="text-xs text-muted-foreground">
                    Deploy a minimal ERC20 token using Coinbase CDP SDK. Pool setup required separately.
                  </p>
                )}
                {deployMethod === "clanker" && (
                  <p className="text-xs text-muted-foreground">
                    Deploy token with automatic Uniswap v4 pool creation and WETH pairing via Clanker SDK. Uses fair
                    price distribution curve.
                  </p>
                )}
                {deployMethod === "external" && (
                  <p className="text-xs text-muted-foreground">
                    Use an external deployer API endpoint (requires configuration).
                  </p>
                )}
              </div>

              {/* Clanker-specific configuration */}
              {deployMethod === "clanker" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="market-cap-eth">Starting Market Cap (ETH)</Label>
                    <Input
                      id="market-cap-eth"
                      type="number"
                      step="0.1"
                      placeholder="10"
                      value={targetMarketCapEth}
                      onChange={(e) => setTargetMarketCapEth(e.target.value)}
                      disabled={isDeploying || !!deployedTokenAddress}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: 10 ETH. This determines the initial token price and liquidity depth.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fee-tier-clanker">Pool Fee Tier</Label>
                    <Select value={feeTier} onValueChange={setFeeTier} disabled={isDeploying || !!deployedTokenAddress}>
                      <SelectTrigger id="fee-tier-clanker">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">0.05%</SelectItem>
                        <SelectItem value="3000">0.3%</SelectItem>
                        <SelectItem value="10000">1% (recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Admin Wallet</Label>
                <Input value={address || ""} disabled className="font-mono text-sm" />
              </div>

              {deployedTokenAddress ? (
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Token Deployed!</p>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground break-all">{deployedTokenAddress}</p>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  onClick={handleDeployToken}
                  disabled={isDeploying || !tokenName || !tokenSymbol}
                  className="w-full"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Token
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Middle Column: Pool Info (only for non-Clanker) */}
          {deployMethod !== "clanker" && (
            <Card
              className={`bg-card/50 backdrop-blur-xl border border-border/50 ${
                !deployedTokenAddress ? "opacity-50" : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  2. USI Pairing Setup
                </CardTitle>
                <CardDescription>
                  {deployedTokenAddress ? "Configure the Uniswap v3 pool" : "Complete token deployment first"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-token-address">New Token Address</Label>
                  <Input
                    id="new-token-address"
                    placeholder="0x..."
                    value={deployedTokenAddress}
                    onChange={(e) => setDeployedTokenAddress(e.target.value)}
                    disabled={!deployedTokenAddress}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usi-token-address">USI Token Address</Label>
                  <Input
                    id="usi-token-address"
                    value={usiTokenAddress}
                    disabled
                    className="font-mono text-sm bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee-tier">Uniswap v3 Fee Tier</Label>
                  <Select value={feeTier} onValueChange={setFeeTier} disabled={!deployedTokenAddress}>
                    <SelectTrigger id="fee-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500" disabled>
                        0.05% (disabled)
                      </SelectItem>
                      <SelectItem value="3000" disabled>
                        0.3% (disabled)
                      </SelectItem>
                      <SelectItem value="10000">1% (recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-mc">Target Starting Market Cap (USD)</Label>
                  <Input
                    id="target-mc"
                    type="number"
                    placeholder="1500"
                    value={targetMarketCapEth}
                    onChange={(e) => setTargetMarketCapEth(e.target.value)}
                    disabled={!deployedTokenAddress}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-source">Token &gt; USD Price Source</Label>
                  <Select value="manual" onValueChange={() => {}} disabled={!deployedTokenAddress}>
                    <SelectTrigger id="price-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual USI Price</SelectItem>
                      <SelectItem value="api">Fetch from API (TODO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usi-price">USI Price (USD)</Label>
                  <Input
                    id="usi-price"
                    type="number"
                    step="0.0001"
                    placeholder="0.0025"
                    value={targetMarketCapEth}
                    onChange={(e) => setTargetMarketCapEth(e.target.value)}
                    disabled={!deployedTokenAddress}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funding-address">Admin USI Funding Address</Label>
                  <Input
                    id="funding-address"
                    placeholder="0x..."
                    value={fundingAddress}
                    onChange={(e) => setFundingAddress(e.target.value)}
                    disabled={!deployedTokenAddress}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleInitializePairing}
                  disabled={isInitializing || !deployedTokenAddress || !fundingAddress}
                  className="w-full"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Initialize Pool
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {deployMethod === "clanker" && deployedTokenAddress && (
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Deployment Complete
                </CardTitle>
                <CardDescription>Token deployed with WETH pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Token Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                          {deployedTokenAddress}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(deployedTokenAddress)}
                          className="h-8 w-8"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Paired With</Label>
                      <p className="text-sm font-medium mt-1">WETH (Wrapped Ether)</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Starting Market Cap</Label>
                      <p className="text-sm font-medium mt-1">{targetMarketCapEth} ETH</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pool Fee</Label>
                      <p className="text-sm font-medium mt-1">{Number(feeTier) / 10000}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  onClick={() => window.open(`https://basescan.org/token/${deployedTokenAddress}`, "_blank")}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on BaseScan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Right Column: Recent Pairings */}
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Recent Pairings
              </CardTitle>
              <CardDescription>Recently deployed and paired tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPairings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentPairings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No pairings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPairings.map((pairing) => (
                    <Card key={pairing.id} className="bg-muted/10 border-border/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{pairing.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {pairing.profiles?.artist_name || "Unknown"}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
                            USI-Paired
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Token</span>
                          <a
                            href={`https://basescan.org/token/${pairing.coin_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-mono"
                          >
                            {pairing.coin_address?.slice(0, 6)}...{pairing.coin_address?.slice(-4)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Steps Dialog */}
      <Dialog open={showStepsDialog} onOpenChange={setShowStepsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Pool Initialization</DialogTitle>
            <DialogDescription>
              Follow these steps to complete the USI pairing. Execute each transaction from your wallet.
            </DialogDescription>
          </DialogHeader>

          {pairingResult && (
            <div className="space-y-6">
              {/* Deployment Preview */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Deployment Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New token to deposit:</span>
                    <span className="font-mono">
                      {(Number(pairingResult.amounts?.newToken) / 1e18).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USI to deposit:</span>
                    <span className="font-mono">{(Number(pairingResult.amounts?.usi) / 1e18).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price (NEWTOKEN in USI):</span>
                    <span className="font-mono">1 NEWTOKEN = {pairingResult.amounts?.tokenPerUsi.toFixed(6)} USI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee tier:</span>
                    <span className="font-mono">{Number(feeTier) / 10000}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pool:</span>
                    <span className="font-mono">USI / {tokenSymbol}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              <div className="space-y-4">
                {pairingResult.steps?.map((step, index) => (
                  <Card key={index} className="bg-muted/10 border-border/50">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{step.label}</CardTitle>
                          <CardDescription className="text-xs mt-1">{step.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Contract Address</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{step.to}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(step.to)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Function</Label>
                        <code className="block text-xs bg-muted p-2 rounded font-mono">{step.functionName}</code>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Arguments</Label>
                        <div className="flex items-start gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all max-h-32 overflow-y-auto">
                            {JSON.stringify(step.args, null, 2)}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(JSON.stringify(step.args))}
                            className="h-8 w-8"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> Execute these transactions in order from your connected wallet. Make sure you
                    have enough ETH for gas fees and the required USI tokens in your wallet.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
