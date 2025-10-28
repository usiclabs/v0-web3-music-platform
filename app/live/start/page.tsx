"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Radio, AlertCircle, Loader2, CheckCircle, Upload, Music } from "lucide-react"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import Link from "next/link"

export default function StartLivePage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [eligibility, setEligibility] = useState<{
    eligible: boolean
    trackCount: number
    requiredTracks: number
  } | null>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(true)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)

  useEffect(() => {
    async function checkEligibility() {
      if (!address) {
        console.log("[v0] No address, skipping eligibility check")
        setCheckingEligibility(false)
        return
      }

      console.log("[v0] Starting eligibility check for:", address)
      setCheckingEligibility(true)
      setEligibilityError(null)

      try {
        const res = await fetch(`/api/live/check-eligibility?address=${address}`)
        console.log("[v0] Eligibility check response status:", res.status)

        if (!res.ok) {
          throw new Error(`Failed to check eligibility: ${res.status}`)
        }

        const data = await res.json()
        console.log("[v0] Eligibility data received:", data)
        setEligibility(data)
      } catch (error) {
        console.error("[v0] Error checking eligibility:", error)
        setEligibilityError(error instanceof Error ? error.message : "Failed to check eligibility")
      } finally {
        console.log("[v0] Eligibility check complete, setting checkingEligibility to false")
        setCheckingEligibility(false)
      }
    }

    checkEligibility()
  }, [address])

  async function handleCreateStream() {
    if (!address || !title.trim()) return

    setLoading(true)
    try {
      console.log("[v0] Creating stream with title:", title)

      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          title: title.trim(),
          description: description.trim(),
        }),
      })

      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Received non-JSON response:", await res.text())
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create stream")
      }

      console.log("[v0] Stream created successfully:", data.id)
      router.push(`/live/studio/${data.id}`)
    } catch (error: any) {
      console.error("[v0] Error creating stream:", error)
      alert(error.message || "Failed to create stream. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to start a live stream"
            icon={<Radio className="h-10 w-10 md:h-12 md:w-12 text-red-500" />}
          />
        </main>
      </div>
    )
  }

  if (eligibilityError) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6 max-w-3xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-xl border border-red-500/50 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Unable to Check Eligibility</h2>
              <p className="text-muted-foreground">{eligibilityError}</p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  if (checkingEligibility) {
    console.log("[v0] Rendering loading state, checkingEligibility:", checkingEligibility)
    return (
      <div className="min-h-screen pb-32 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking eligibility...</p>
        </div>
      </div>
    )
  }

  console.log("[v0] Rendering main content, eligibility:", eligibility)

  if (eligibility && !eligibility.eligible) {
    const tracksNeeded = eligibility.requiredTracks - eligibility.trackCount

    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6 max-w-3xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-xl border border-yellow-500/50 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Almost There!</h2>
              <p className="text-lg text-muted-foreground">You need a few more tracks before you can go live</p>
            </div>

            <div className="bg-background/50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Live Streaming Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published Tracks</span>
                  <span className="font-semibold">
                    {eligibility.trackCount} / {eligibility.requiredTracks}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(eligibility.trackCount / eligibility.requiredTracks) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  You need {tracksNeeded} more track{tracksNeeded !== 1 ? "s" : ""} to unlock live streaming
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Why do I need 3 tracks?</strong>
                  <br />
                  We require artists to have at least 3 published tracks to ensure quality content and build an audience
                  before going live.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1" size="lg">
                  <Link href="/dashboard/upload">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Tracks
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent" size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-bold">Start Live Stream</h1>
          </div>
          <p className="text-muted-foreground">Set up your live stream details</p>
        </div>

        {eligibility?.eligible && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              You're eligible to go live! You have {eligibility.trackCount} published tracks.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Stream Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Live Performance - New Album"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/100 characters</p>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Tell your audience what to expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/500 characters</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure you have a stable internet connection and allow camera/microphone access when prompted.
              </AlertDescription>
            </Alert>

            <Button onClick={handleCreateStream} disabled={!title.trim() || loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Stream...
                </>
              ) : (
                <>
                  <Radio className="h-5 w-5 mr-2" />
                  Create Stream
                </>
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
