"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coins, Clock, CheckCircle2, ExternalLink, Music, AlertCircle, Sparkles, Lock, Loader2 } from "lucide-react"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { useAccount, useReadContract } from "wagmi"
import { USDC_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { base } from "wagmi/chains"
import { formatUnits } from "viem"
import Link from "next/link"
import { useEIP3009 } from "@/lib/web3/use-eip3009"

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

  const { isSmartWallet, supportsGaslessPayments } = useEIP3009()

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
  const displayDuration = formatDuration(currentTrack.duration)
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
        console.log("[v0] Payment step update:", step, hash ? `hash: ${hash}` : "")
        setPaymentStep(step as PaymentStep)
        if (hash) setTxHash(hash)
      })

      setPaymentStep("success")
      addToast({
        title: "Payment Successful!",
        description: `${isFullUnlock ? "Full track unlocked" : `Segment ${segmentNumber} unlocked`}. ${txHash ? "Transaction confirmed on Base." : ""}`,
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

      let errorMessage = "Payment failed. Please try again."

      if (err instanceof Error) {
        if (err.message.includes("timeout") || err.message.includes("Timeout")) {
          errorMessage =
            "Payment timeout. On mobile, please ensure MetaMask is open and check for pending signature requests. You may need to switch to the MetaMask app manually."
        } else if (err.message.includes("rejected") || err.message.includes("denied")) {
          errorMessage = "Payment was rejected. Please approve the signature request in your wallet."
        } else if (err.message.includes("Not Supported") || err.message.includes("not supported")) {
          errorMessage =
            "Your wallet doesn't support this payment method. Try using MetaMask, Rainbow, or Trust Wallet."
        } else if (err.message.includes("Network") || err.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else {
          errorMessage = err.message
        }
      }

      addToast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "error",
        duration: 10000, // Longer duration for mobile users to read error
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
        return "Please sign the payment authorization in your wallet... (On mobile, you may need to switch to MetaMask app)"
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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-background border border-white/10 shadow-2xl">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            {isAfterFreePreview ? "Continue Listening" : "X402 Payment Required"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground/70">
            {isAfterFreePreview ? (
              <>
                {isFullUnlock
                  ? "Enjoyed the preview? Pay once to unlock the entire track."
                  : "Enjoyed the preview? Pay to continue streaming."}
              </>
            ) : (
              <>
                {isFullUnlock
                  ? "Pay once to unlock and stream the entire track"
                  : "Pay to unlock and stream this track"}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-6">
          {/* Track Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-white/5 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{currentTrack.title}</p>
              <p className="text-xs text-foreground/60 mt-1">
                {currentTrack.artist?.artist_name || formatAddress(currentTrack.artist_id)}
              </p>
            </div>
          </div>

          {/* Token Gated Section */}
          {currentTrack?.token_gated_streaming && currentTrack?.coin_address && (
            <div className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-sm">Token-Gated Track</h3>
              </div>

              {isLoadingTokenBalance ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <span className="ml-2 text-xs text-foreground/60">Checking token balance...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/60">Your Balance</span>
                      <span className="font-mono font-semibold text-foreground/90">
                        {Number.parseFloat(formattedTokenBalance).toLocaleString()} {tokenSymbol || "tokens"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/60">Required</span>
                      <span className="font-mono font-semibold text-foreground/90">
                        {currentTrack.required_token_balance?.toLocaleString()} {tokenSymbol || "tokens"}
                      </span>
                    </div>
                  </div>

                  {hasEnoughTokens ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span className="font-semibold">You have enough tokens to stream free!</span>
                      </div>
                      <p className="text-xs text-foreground/60">Refresh to activate free streaming.</p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent border-white/10 hover:bg-white/5 text-foreground h-9 text-xs"
                      onClick={() => window.open(`/tokens?address=${currentTrack.coin_address}`, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Buy {tokenSymbol || "Tokens"}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Free Preview */}
          {isAfterFreePreview && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                You've listened to the first 30 seconds for free!
              </p>
            </div>
          )}

          {/* Gas Subsidy */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              gasSubsidyAvailable
                ? "bg-primary/10 border-primary/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}
          >
            <Sparkles className={`h-4 w-4 flex-shrink-0 ${gasSubsidyAvailable ? "text-primary" : "text-amber-500"}`} />
            <p className={`text-xs font-medium ${gasSubsidyAvailable ? "text-primary" : "text-amber-600 dark:text-amber-400"}`}>
              {gasSubsidyAvailable ? (
                <>
                  <span className="font-semibold">Gasless Payment:</span> No ETH needed! We cover the fees for you.
                </>
              ) : (
                <>
                  <span className="font-semibold">Gas Required:</span> Small ETH amount needed (~$0.01).
                </>
              )}
            </p>
          </div>

          {isSmartWallet && !supportsGaslessPayments && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Base App Payment</p>
                <p className="text-xs text-foreground/60">Gas fees may apply (~$0.01).</p>
              </div>
            </div>
          )}

          {isConnected && hasInsufficientBalance && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Need {requiredAmount} USDC • You have {formattedBalance} USDC
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

          {/* Track Details */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Full Track Unlock</span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {isValidPrice ? currentTrack.price_per_chunk : "0"} USDC
              </span>
            </div>

            {isConnected && address && (
              <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
                    <Coins className="h-4 w-4 text-foreground/60" />
                  </div>
                  <span className="text-sm text-foreground/70">Your Balance</span>
                </div>
                <span className={`text-sm font-semibold ${hasInsufficientBalance ? "text-red-500" : "text-foreground/90"}`}>
                  {formattedBalance} USDC
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
                  <Clock className="h-4 w-4 text-foreground/60" />
                </div>
                <span className="text-sm text-foreground/70">Full Duration</span>
              </div>
              <span className="text-sm font-semibold text-foreground/90">{displayDuration}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={skipTrack}
              className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-foreground h-10 font-medium"
              disabled={isProcessing}
            >
              Skip Track
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1 h-10 font-medium"
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
