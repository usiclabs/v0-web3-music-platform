"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, DollarSign, Sparkles, Music } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { createPublicClient, createWalletClient, custom, http } from "viem"
import { base } from "viem/chains"
import { USDC_ADDRESS } from "@/lib/web3/contracts"

interface X402GenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: () => void
}

type PaymentStep = "checking" | "approve" | "pay" | "processing" | "complete" | "error"

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const

export function X402GenerationModal({ isOpen, onClose, onPaymentComplete }: X402GenerationModalProps) {
  const { address, isConnected } = useWallet()
  const [step, setStep] = useState<PaymentStep>("checking")
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [isProcessing, setIsProcessing] = useState(false)
  const [relayerAddress, setRelayerAddress] = useState<string | null>(null)
  const [nonce, setNonce] = useState<string>("")

  const GENERATION_PRICE = 1_000_000n // $1 USDC

  useEffect(() => {
    if (isOpen && address) {
      checkPaymentStatus()
    }
  }, [isOpen, address])

  const checkPaymentStatus = async () => {
    if (!address) return

    setStep("checking")
    setError(null)

    try {
      // Get payment requirements
      const response = await fetch("/api/x402/generate")
      const data = await response.json()

      if (data.payment?.metadata?.nonce) {
        setNonce(data.payment.metadata.nonce)
      }

      const recipient = data.payment?.recipient
      if (recipient) {
        setRelayerAddress(recipient)
      }

      // Check user's balance and allowance
      const verifyResponse = await fetch("/api/x402/generate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      })

      const verifyData = await verifyResponse.json()
      setBalance(verifyData.balance || "0")

      if (!verifyData.hasBalance) {
        setError(`Insufficient USDC balance. You have ${verifyData.balance} USDC but need 1.00 USDC`)
        setStep("error")
        return
      }

      if (!verifyData.hasAllowance) {
        setStep("approve")
      } else {
        setStep("pay")
      }
    } catch (err) {
      console.error("[v0] Error checking payment status:", err)
      setError("Failed to check payment status")
      setStep("error")
    }
  }

  const handleApprove = async () => {
    if (!address || !relayerAddress || !window.ethereum) return

    setIsProcessing(true)
    setError(null)

    try {
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum),
      })

      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      })

      const usdcAddress = USDC_ADDRESS[8453]

      // Approve the relayer to spend USDC
      const approveTxHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [relayerAddress as `0x${string}`, GENERATION_PRICE],
        account: address as `0x${string}`,
      })

      console.log("[v0] Approval tx sent:", approveTxHash)

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash: approveTxHash,
        confirmations: 1,
      })

      console.log("[v0] Approval confirmed")
      setStep("pay")
    } catch (err) {
      console.error("[v0] Approval error:", err)
      setError(err instanceof Error ? err.message : "Approval failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePay = async () => {
    if (!address) return

    setIsProcessing(true)
    setError(null)
    setStep("processing")

    try {
      // Request the relayer to execute the transfer
      const response = await fetch("/api/x402/generate/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: address,
          nonce: nonce || `gen-${Date.now()}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      console.log("[v0] Payment complete:", data.txHash)
      setStep("complete")

      // Wait a moment then trigger the generation
      setTimeout(() => {
        onPaymentComplete()
        onClose()
      }, 1500)
    } catch (err) {
      console.error("[v0] Payment error:", err)
      setError(err instanceof Error ? err.message : "Payment failed")
      setStep("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const renderContent = () => {
    switch (step) {
      case "checking":
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-500" />
            <p className="text-muted-foreground">Checking payment status...</p>
          </div>
        )

      case "approve":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl">
                  <DollarSign className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Approve USDC</h3>
              <p className="text-muted-foreground text-sm">
                First, approve the platform to spend 1 USDC from your wallet for AI song generation.
              </p>
            </div>

            <div className="bg-card/50 border border-border/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your Balance</span>
                <span className="font-mono font-bold">{Number.parseFloat(balance).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">Generation Cost</span>
                <span className="font-mono font-bold text-red-500">1.00 USDC</span>
              </div>
            </div>

            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve USDC"
              )}
            </Button>
          </div>
        )

      case "pay":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Generate Your Song</h3>
              <p className="text-muted-foreground text-sm">
                Pay 1 USDC to generate your AI-powered track. The payment goes directly to the platform via x402.
              </p>
            </div>

            <div className="bg-card/50 border border-border/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Generation Cost</span>
                <span className="font-mono font-bold text-red-500">1.00 USDC</span>
              </div>
            </div>

            <Button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay 1 USDC & Generate
                </>
              )}
            </Button>
          </div>
        )

      case "processing":
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-red-500" />
              <Music className="absolute inset-0 m-auto h-6 w-6 text-red-500" />
            </div>
            <p className="text-muted-foreground">Processing x402 payment...</p>
            <p className="text-xs text-muted-foreground">Please wait while we confirm your transaction</p>
          </div>
        )

      case "complete":
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-full">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-green-500">Payment Complete!</h3>
            <p className="text-muted-foreground text-sm text-center">Your song is now being generated...</p>
          </div>
        )

      case "error":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={checkPaymentStatus} variant="outline" className="w-full bg-transparent">
              Try Again
            </Button>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 rounded-lg">
              <Music className="h-4 w-4 text-white" />
            </div>
            x402 Song Generation
          </DialogTitle>
          <DialogDescription>Pay with USDC to generate your AI-powered track</DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
