"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Coins,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ExternalLink,
  Music,
  AlertCircle,
  Sparkles,
  Lock,
  Loader2,
} from "lucide-react"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { useState, useEffect } from "react"
import { X402_CONFIG } from "@/lib/web3/contracts"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { useAccount, useReadContract } from "wagmi"
import { USDC_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { base } from "wagmi/chains"
import { formatUnits } from "viem"
import Link from "next/link"

type PaymentStep = "idle" | "signing" | "verifying" | "settling" | "confirming" | "success" | "error"

export function X402PaymentModal() {
  const { currentTrack, showPaymentModal, closePaymentModal, payForChunk, currentChunk, skipTrack } = useAudioPlayer()
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle")
  const [txHash, setTxHash] = useState<string | null>(null)
  const { addToast } = useToast()
  const { isConnected, connect } = useWallet()
  const { address } = useAccount()
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false)
  const [gasSubsidyAvailable, setGasSubsidyAvailable] = useState(true)

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS[base.id],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address && isConnected,
    },
  })

  const { data: tokenBalance, isLoading: isLoadingTokenBalance } = useReadContract({
    address: currentTrack?.coin_address as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!(currentTrack?.token_gated_streaming && currentTrack?.coin_address && address),
    },
  })

  const { data: tokenDecimals } = useReadContract({
    address: currentTrack?.coin_address as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: !!(currentTrack?.token_gated_streaming && currentTrack?.coin_address),
    },
  })

  const { data: tokenSymbol } = useReadContract({
    address: currentTrack?.coin_address as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: {
      enabled: !!(currentTrack?.token_gated_streaming && currentTrack?.coin_address),
    },
  })

  const formattedTokenBalance =
    tokenBalance && tokenDecimals ? formatUnits(tokenBalance as bigint, tokenDecimals as number) : "0"

  const hasEnoughTokens =
    currentTrack?.token_gated_streaming &&
    tokenBalance &&
    currentTrack?.required_token_balance &&
    Number.parseFloat(formattedTokenBalance) >= Number.parseFloat(currentTrack.required_token_balance.toString())

  useEffect(() => {
    if (currentTrack && balance !== undefined && address) {
      const priceString = currentTrack.price_per_chunk?.toString() || "0"
      const priceFloat = Number.parseFloat(priceString)

      if (Number.isNaN(priceFloat) || priceFloat < 0) {
        console.error("[v0] Invalid price_per_chunk:", currentTrack.price_per_chunk)
        setHasInsufficientBalance(false)
        return
      }

      const requiredAmount = BigInt(Math.floor(priceFloat * 1_000_000))
      const userBalance = balance as bigint
      setHasInsufficientBalance(userBalance < requiredAmount)
    }
  }, [balance, currentTrack, address])

  if (!currentTrack) return null

  const priceString = currentTrack.price_per_chunk?.toString() || "0"
  const priceFloat = Number.parseFloat(priceString)
  const isValidPrice = !Number.isNaN(priceFloat) && priceFloat >= 0
  const requiredAmount = isValidPrice ? priceFloat : 0

  const isFullUnlock = currentTrack.unlock_type === "full_song"
  const displayDuration = isFullUnlock ? formatDuration(currentTrack.duration) : `${X402_CONFIG.CHUNK_DURATION} seconds`
  const isAfterFreePreview = currentChunk > 0

  const segmentNumber = currentChunk + 1

  const formattedBalance = balance !== undefined ? formatUnits(balance as bigint, 6) : "0"

  const handlePayment = async () => {
    if (!isValidPrice) {
      addToast({
        title: "Invalid Price",
        description: "This track has an invalid price. Please contact support.",
        variant: "error",
        duration: 5000,
      })
      return
    }

    if (!isConnected) {
      try {
        await connect()
        addToast({
          title: "Wallet Connected",
          description: "Please click Pay again to continue with payment.",
          variant: "success",
          duration: 3000,
        })
        return
      } catch (err) {
        console.error("[v0] Wallet connection failed:", err)
        addToast({
          title: "Connection Failed",
          description: "Please try connecting your wallet again.",
          variant: "error",
          duration: 4000,
        })
        return
      }
    }

    if (hasInsufficientBalance) {
      addToast({
        title: "Insufficient Balance",
        description: `You need ${requiredAmount} USDC but only have ${formattedBalance} USDC. Please get more USDC to continue.`,
        variant: "error",
        duration: 5000,
      })
      return
    }

    setPaymentStep("signing")
    setTxHash(null)

    try {
      await payForChunk(currentChunk, (step, hash) => {
        setPaymentStep(step as PaymentStep)
        if (hash) setTxHash(hash)
      })

      setPaymentStep("success")
      addToast({
        title: "Payment Successful!",
        description: `Segment ${segmentNumber} unlocked. ${txHash ? "Transaction confirmed on Base." : ""}`,
        variant: "success",
        duration: 4000,
      })

      setTimeout(() => {
        refetchBalance()
      }, 2000)

      setTimeout(() => {
        closePaymentModal()
        setPaymentStep("idle")
        setTxHash(null)
      }, 1500)
    } catch (err) {
      console.error("[v0] Payment failed:", err)
      setPaymentStep("error")

      const errorMessage = err instanceof Error ? err.message : "Payment failed. Please try again."
      addToast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "error",
        duration: 5000,
      })

      setTimeout(() => {
        setPaymentStep("idle")
        setTxHash(null)
      }, 3000)
    }
  }

  const isProcessing = paymentStep !== "idle" && paymentStep !== "success" && paymentStep !== "error"

  const getStepMessage = () => {
    switch (paymentStep) {
      case "signing":
        return "Please sign the payment authorization in your wallet..."
      case "verifying":
        return "Verifying payment signature..."
      case "settling":
        return "Submitting transaction to Base blockchain..."
      case "confirming":
        return "Waiting for transaction confirmation..."
      case "success":
        return "Payment confirmed! Starting playback..."
      case "error":
        return "Payment failed. Please try again."
      default:
        return null
    }
  }

  return (
    <Dialog open={showPaymentModal} onOpenChange={closePaymentModal}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-5 w-5 text-primary" />
            {isAfterFreePreview ? "Continue Listening" : "X402 Micropayment Required"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isAfterFreePreview ? (
              <>
                {isFullUnlock
                  ? "Enjoyed the preview? Pay once to unlock the entire track."
                  : "Enjoyed the preview? Pay to continue streaming using the X402 protocol."}
              </>
            ) : (
              <>
                {isFullUnlock
                  ? "Pay once to unlock and stream the entire track using the X402 protocol"
                  : "Pay to unlock and stream this track using the X402 protocol"}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex-1">
              <p className="font-semibold text-sm">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">
                {currentTrack.artist?.artist_name || formatAddress(currentTrack.artist_id)}
              </p>
            </div>
          </div>

          {currentTrack?.token_gated_streaming && currentTrack?.coin_address && (
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-sm">Token-Gated Track</h3>
              </div>

              {isLoadingTokenBalance ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span className="ml-2 text-sm text-muted-foreground">Checking token balance...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Your Balance:</span>
                      <span className="font-mono font-semibold">
                        {Number.parseFloat(formattedTokenBalance).toLocaleString()} {tokenSymbol || "tokens"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Required:</span>
                      <span className="font-mono font-semibold">
                        {currentTrack.required_token_balance?.toLocaleString()} {tokenSymbol || "tokens"}
                      </span>
                    </div>
                  </div>

                  {hasEnoughTokens ? (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-md p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">You have enough tokens to stream for free!</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Refresh the page or restart the track to activate free streaming.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-muted/30 rounded-md p-3 text-xs text-muted-foreground">
                        Hold {currentTrack.required_token_balance?.toLocaleString()} {tokenSymbol || "tokens"} to stream
                        for free
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => window.open(`/tokens?address=${currentTrack.coin_address}`, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Buy {tokenSymbol || "Tokens"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {isAfterFreePreview && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">
                You've listened to the first 30 seconds for free!
              </p>
            </div>
          )}

          <div
            className={`flex items-center gap-2 p-3 rounded-lg border ${
              gasSubsidyAvailable ? "bg-primary/10 border-primary/20" : "bg-amber-500/10 border-amber-500/20"
            }`}
          >
            <Sparkles className={`h-4 w-4 flex-shrink-0 ${gasSubsidyAvailable ? "text-primary" : "text-amber-500"}`} />
            <p className={`text-xs ${gasSubsidyAvailable ? "text-primary" : "text-amber-600 dark:text-amber-400"}`}>
              {gasSubsidyAvailable ? (
                <>
                  <span className="font-semibold">Gasless Payment:</span> No ETH needed! We cover the gas fees for you.
                </>
              ) : (
                <>
                  <span className="font-semibold">Gas Required:</span> You'll need a small amount of ETH for gas fees
                  (~$0.01).
                </>
              )}
            </p>
          </div>

          {isConnected && hasInsufficientBalance && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Insufficient USDC balance. You need {requiredAmount} USDC but only have {formattedBalance} USDC.
                </p>
                <Link href="/swap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-500/30 hover:bg-red-500/10 bg-transparent"
                  >
                    Get USDC
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                {isFullUnlock ? (
                  <>
                    <Music className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Full Track Unlock</span>
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Unlock Segment {segmentNumber}</span>
                  </>
                )}
              </div>
              <span className="text-sm font-bold">{isValidPrice ? currentTrack.price_per_chunk : "0"} USDC</span>
            </div>

            {isConnected && address && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Your Balance</span>
                </div>
                <span className={`text-sm font-medium ${hasInsufficientBalance ? "text-red-500" : ""}`}>
                  {formattedBalance} USDC
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{isFullUnlock ? "Full Duration" : "Duration"}</span>
              </div>
              <span className="text-sm font-medium">{displayDuration}</span>
            </div>
          </div>

          {isProcessing && getStepMessage() && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <Loader2 className="h-4 w-4 animate-spin text-accent flex-shrink-0" />
              <p className="text-sm text-accent">{getStepMessage()}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">X402 Benefits</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">100% Gasless</p>
                  <p className="text-xs text-muted-foreground">We pay all gas fees - you only pay for content</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Instant Streaming</p>
                  <p className="text-xs text-muted-foreground">Sign once and start listening immediately</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Secure & Private</p>
                  <p className="text-xs text-muted-foreground">Cryptographic payment authorization</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={skipTrack} className="flex-1 bg-transparent" disabled={isProcessing}>
              Skip Track
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing || (isConnected && hasInsufficientBalance)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  {!isConnected ? "Connect Wallet" : `Pay ${isValidPrice ? currentTrack.price_per_chunk : "0"} USDC`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
