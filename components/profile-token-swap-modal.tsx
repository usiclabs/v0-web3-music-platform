"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ArrowDown, Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { usePublicClient, useWalletClient } from "wagmi"
import { formatUnits, parseUnits, type Address } from "viem"
import { detectV4Pool, getV4Quote, executeV4Swap, type V4PoolKey } from "@/lib/web3/uniswap-v4-swap"
import { WETH_ADDRESS } from "@/lib/web3/contracts"

interface ProfileTokenSwapModalProps {
  tokenAddress: Address
  tokenName: string
  tokenSymbol?: string
  onClose: () => void
}

export function ProfileTokenSwapModal({ tokenAddress, tokenName, tokenSymbol, onClose }: ProfileTokenSwapModalProps) {
  const { address, chainId } = useWallet()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [ethAmount, setEthAmount] = useState("")
  const [tokenAmount, setTokenAmount] = useState("")
  const [isLoadingPool, setIsLoadingPool] = useState(true)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [poolKey, setPoolKey] = useState<V4PoolKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [ethBalance, setEthBalance] = useState<bigint>(0n)

  // Fetch pool info on mount
  useEffect(() => {
    if (!chainId || !publicClient) return

    const fetchPool = async () => {
      setIsLoadingPool(true)
      setError(null)

      try {
        const pool = await detectV4Pool(tokenAddress, chainId, publicClient)

        if (!pool) {
          setError("No Uniswap V4 pool found for this token")
          setIsLoadingPool(false)
          return
        }

        setPoolKey(pool)
        console.log("[v0] Found V4 pool:", pool)
      } catch (err: any) {
        console.error("[v0] Failed to detect pool:", err)
        setError("Failed to load pool information")
      } finally {
        setIsLoadingPool(false)
      }
    }

    fetchPool()
  }, [tokenAddress, chainId, publicClient])

  // Fetch ETH balance
  useEffect(() => {
    if (!address || !publicClient) return

    const fetchBalance = async () => {
      try {
        const balance = await publicClient.getBalance({ address })
        setEthBalance(balance)
      } catch (err) {
        console.error("[v0] Failed to fetch balance:", err)
      }
    }

    fetchBalance()
  }, [address, publicClient])

  // Get quote when ETH amount changes
  useEffect(() => {
    if (!ethAmount || !poolKey || !publicClient || !chainId) {
      setTokenAmount("")
      return
    }

    const getQuote = async () => {
      setIsLoadingQuote(true)
      setError(null)

      try {
        const amountIn = parseUnits(ethAmount, 18)
        const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] as Address

        // Determine if we're swapping WETH -> Token or Token -> WETH
        const zeroForOne = wethAddress.toLowerCase() === poolKey.currency0.toLowerCase()

        const quote = await getV4Quote(poolKey, amountIn, zeroForOne, publicClient, chainId)

        setTokenAmount(formatUnits(quote, 18))
      } catch (err: any) {
        console.error("[v0] Failed to get quote:", err)
        setError("Failed to get quote. Pool may have insufficient liquidity.")
        setTokenAmount("")
      } finally {
        setIsLoadingQuote(false)
      }
    }

    const debounce = setTimeout(getQuote, 500)
    return () => clearTimeout(debounce)
  }, [ethAmount, poolKey, publicClient, chainId])

  const handleSwap = async () => {
    if (!address || !walletClient || !publicClient || !poolKey || !chainId || !ethAmount) {
      setError("Missing required parameters")
      return
    }

    setIsSwapping(true)
    setError(null)
    setTxHash(null)

    try {
      const amountIn = parseUnits(ethAmount, 18)
      const amountOutMin = parseUnits(tokenAmount, 18)
      const slippage = (amountOutMin * 95n) / 100n // 5% slippage tolerance

      const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] as Address

      const result = await executeV4Swap(
        {
          tokenIn: wethAddress,
          tokenOut: tokenAddress,
          amountIn,
          amountOutMinimum: slippage,
          recipient: address,
          chainId,
        },
        poolKey,
        walletClient,
        publicClient,
      )

      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        console.log("[v0] Swap successful:", result.txHash)
      } else {
        setError(result.error || "Swap failed")
      }
    } catch (err: any) {
      console.error("[v0] Swap error:", err)
      setError(err.message || "Failed to execute swap")
    } finally {
      setIsSwapping(false)
    }
  }

  const maxEthAmount = ethBalance > 0n ? formatUnits(ethBalance - parseUnits("0.001", 18), 18) : "0" // Leave 0.001 ETH for gas

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Swap for {tokenSymbol || tokenName}</CardTitle>
              <CardDescription>Trade ETH for profile tokens</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {isLoadingPool ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error && !poolKey ? (
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm text-amber-200">{error}</div>
              </CardContent>
            </Card>
          ) : txHash ? (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="space-y-4 py-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-green-500">Swap Successful!</div>
                    <div className="text-sm text-muted-foreground">Your transaction has been confirmed</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                    View on BaseScan
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button className="w-full" onClick={onClose}>
                  Close
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* From: ETH */}
              <div className="space-y-2">
                <Label>From</Label>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ETH</span>
                      <span className="text-xs text-muted-foreground">
                        Balance: {formatUnits(ethBalance, 18).slice(0, 8)} ETH
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        disabled={isSwapping}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEthAmount(maxEthAmount)}
                        disabled={isSwapping}
                      >
                        MAX
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-2">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </div>

              {/* To: Token */}
              <div className="space-y-2">
                <Label>To (estimated)</Label>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tokenSymbol || tokenName}</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {isLoadingQuote ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : tokenAmount ? (
                        Number.parseFloat(tokenAmount).toFixed(4)
                      ) : (
                        "0.0"
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {error && poolKey && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="flex items-center gap-3 py-4">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="text-sm text-red-200">{error}</div>
                  </CardContent>
                </Card>
              )}

              {/* Swap Info */}
              {tokenAmount && !error && (
                <Card className="bg-muted/20">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span>
                        1 ETH ≈ {(Number.parseFloat(tokenAmount) / Number.parseFloat(ethAmount || "1")).toFixed(2)}{" "}
                        {tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage Tolerance</span>
                      <span>5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Received</span>
                      <span>
                        {(Number.parseFloat(tokenAmount) * 0.95).toFixed(4)} {tokenSymbol}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Swap Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSwap}
                disabled={!ethAmount || !tokenAmount || isSwapping || isLoadingQuote || !!error}
              >
                {isSwapping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  "Swap"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
