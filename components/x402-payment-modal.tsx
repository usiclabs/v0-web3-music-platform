"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Coins,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Music,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { useState, useEffect } from "react"
import { X402_CONFIG } from "@/lib/web3/contracts"
import { useToast } from "@/components/ui/toast"
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

  useEffect(() => {
    if (currentTrack && balance !== undefined && address) {
      // Validate and parse price_per_chunk
      const priceString = currentTrack.price_per_chunk?.toString() || "0"
      const priceFloat = Number.parseFloat(priceString)

      // Check if price is valid
      if (Number.isNaN(priceFloat) || priceFloat < 0) {
        console.error("[v0] Invalid price_per_chunk:", currentTrack.price_per_chunk)
        setHasInsufficientBalance(false)
        return
      }

      const requiredAmount = BigInt(Math.floor(priceFloat * 1_000_000)) // Convert to USDC units (6 decimals)
      const userBalance = balance as bigint
      setHasInsufficientBalance(userBalance < requiredAmount)

      console.log(
        "[v0] Balance check - Required:",
        requiredAmount.toString(),
        "Balance:",
        userBalance.toString(),
        "Insufficient:",
        userBalance < requiredAmount,
      )
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

  // Segment number = chunk index + 1 (since chunk 0 is the first segment)
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
      <DialogContent className="sm:max-w-md">
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
          {/* Track Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex-1">
              <p className="font-semibold text-sm">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">
                {currentTrack.artist?.artist_name || formatAddress(currentTrack.artist_id)}
              </p>
            </div>
          </div>

          {isAfterFreePreview && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">
                You've listened to the first 30 seconds for free!
              </p>
            </div>
          )}

          {/* Gasless Payment Indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-primary">
              <span className="font-semibold">Gasless Payment:</span> No ETH needed! We cover the gas fees for you.
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

          {paymentStep === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="rounded-full bg-green-500/20 p-3 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">Starting playback...</p>
              </div>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View on BaseScan <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <p className="font-medium">{getStepMessage()}</p>
                {paymentStep === "confirming" && txHash && (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <p className="text-xs text-muted-foreground">This may take a few seconds...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Details */}
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

              {/* X402 Benefits */}
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

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={skipTrack} className="flex-1 bg-transparent" disabled={isProcessing}>
                  Skip Track
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1"
                  disabled={isProcessing || (isConnected && hasInsufficientBalance)}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {!isConnected ? "Connect Wallet" : `Pay ${isValidPrice ? currentTrack.price_per_chunk : "0"} USDC`}
                </Button>
              </div>
            </>
          )}
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
