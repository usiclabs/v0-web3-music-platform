"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Coins, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { checkProfileTokenGate, formatUSIBalance } from "@/lib/web3/profile-token-gate"
import type { ProfileTokenGateStatus } from "@/lib/web3/profile-token-gate"

interface TokenizeProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (tokenAddress: string) => void
  artistName?: string
}

export function TokenizeProfileModal({ open, onOpenChange, onSuccess, artistName }: TokenizeProfileModalProps) {
  const { address, chainId } = useWallet()
  const [tokenName, setTokenName] = useState(artistName || "")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingGate, setCheckingGate] = useState(false)
  const [gateStatus, setGateStatus] = useState<ProfileTokenGateStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const checkGateStatus = async () => {
    if (!address) return

    setCheckingGate(true)
    setError(null)

    try {
      const status = await checkProfileTokenGate(address, chainId || 8453)
      setGateStatus(status)

      if (!status.canTokenize) {
        const reasons = []
        if (status.alreadyTokenized) reasons.push("Profile already tokenized")
        if (reasons.length > 0) {
          setError(reasons.join(". "))
        }
      }
    } catch (err) {
      setError("Failed to check requirements")
    } finally {
      setCheckingGate(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !tokenName || !tokenSymbol) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/profile/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          tokenName,
          tokenSymbol: tokenSymbol.toUpperCase(),
          chainId: chainId || 8453,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to tokenize profile")
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess(data.tokenAddress)
        onOpenChange(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to tokenize profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Tokenize Your Profile
          </DialogTitle>
          <DialogDescription>
            Create your own profile token on Base. This is a one-time action and cannot be changed.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Profile Tokenized!</h3>
            <p className="text-muted-foreground">Your profile token has been deployed successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Requirements:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Can only be done once per profile</li>
                  <li>Creates a unique token tied to your profile</li>
                </ul>
              </AlertDescription>
            </Alert>

            {gateStatus && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Profile Status:</span>
                  <span className={gateStatus.alreadyTokenized ? "text-orange-500" : "text-green-500"}>
                    {gateStatus.alreadyTokenized ? "Already Tokenized" : "Ready to Tokenize"}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="tokenName">Token Name</Label>
              <Input
                id="tokenName"
                placeholder="Your Artist Name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Recommended: Use your artist name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenSymbol">Token Symbol (Ticker)</Label>
              <Input
                id="tokenSymbol"
                placeholder="e.g., KING"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                maxLength={10}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Choose carefully - this cannot be changed</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={checkGateStatus}
                disabled={checkingGate || loading}
                className="flex-1 bg-transparent"
              >
                {checkingGate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Requirements"
                )}
              </Button>
              <Button
                type="submit"
                disabled={loading || !gateStatus?.canTokenize}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy Token"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
