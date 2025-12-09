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
import { Radio, AlertCircle, CheckCircle, Upload, Music } from "lucide-react"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorState } from "@/components/error-state"
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
  const [checkingEligibility, setCheckingEligibility] = useState(true) // Start as true to show loading initially
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)

  useEffect(() => {
    async function checkEligibility() {
      if (!isConnected || !address) {
        console.log("[v0] Skipping eligibility check - not connected")
        setCheckingEligibility(false)
        return
      }

      console.log("[v0] Starting eligibility check for:", address)
      setCheckingEligibility(true)
      setEligibilityError(null)

      try {
        console.log("[v0] Fetching eligibility from API...")
        const res = await fetch(`/api/live/check-eligibility?address=${address}`)

        console.log("[v0] Eligibility API response status:", res.status)

        if (!res.ok) {
          const errorText = await res.text()
          console.error("[v0] Eligibility check failed:", res.status, errorText)
          throw new Error(`Failed to check eligibility: ${res.status}`)
        }

        const data = await res.json()
        console.log("[v0] Eligibility data received:", JSON.stringify(data))
        setEligibility({
          eligible: data.eligible,
          trackCount: data.trackCount,
          requiredTracks: data.requiredTracks,
        })
        console.log("[v0] Eligibility state updated")
      } catch (error) {
        console.error("[v0] Error checking eligibility:", error)
        setEligibilityError(error instanceof Error ? error.message : "Failed to check eligibility")
      } finally {
        console.log("[v0] Setting checkingEligibility to false")
        setCheckingEligibility(false)
      }
    }

    checkEligibility()
  }, [address, isConnected])

  console.log("[v0] StartLivePage render - checkingEligibility:", checkingEligibility, "eligibility:", eligibility)

  const handleCreateStream = async () => {
    if (!title.trim()) {
      return
    }

    console.log("[v0] Create stream button clicked")
    setLoading(true)

    try {
      console.log("[v0] Creating stream with:", { address, title, description })

      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      })

      console.log("[v0] Create stream response status:", res.status)

      if (!res.ok) {
        const errorData = await res.json()
        console.error("[v0] Create stream failed:", errorData)
        throw new Error(errorData.error || "Failed to create stream")
      }

      const data = await res.json()
      console.log("[v0] Stream created successfully:", data)

      // Navigate to the studio page
      router.push(`/live/studio/${data.id}`)
    } catch (error) {
      console.error("[v0] Error creating stream:", error)
      alert(error instanceof Error ? error.message : "Failed to create stream. Please try again.")
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

  if (checkingEligibility) {
    console.log("[v0] Rendering loading spinner")
    return (
      <div className="min-h-screen pb-32 bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking eligibility..." />
      </div>
    )
  }

  if (eligibilityError) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6 max-w-3xl mx-auto">
          <ErrorState
            title="Unable to Check Eligibility"
            message={eligibilityError}
            onRetry={() => window.location.reload()}
          />
        </main>
      </div>
    )
  }

  if (eligibility && !eligibility.eligible) {
    const tracksNeeded = eligibility.requiredTracks - eligibility.trackCount

    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6 max-w-3xl mx-auto animate-fade-in">
          <Card className="bg-card/30 backdrop-blur-2xl border border-yellow-500/30 p-8 hover-lift">
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse-slow" />
                <div className="relative bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-full p-6">
                  <AlertCircle className="h-12 w-12 text-yellow-500 animate-bounce-subtle" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 text-balance">Almost There!</h2>
              <p className="text-lg text-foreground/70 text-pretty">
                You need a few more tracks before you can go live
              </p>
            </div>

            <div className="bg-background/30 backdrop-blur-xl rounded-xl p-6 mb-6 border border-border/30">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Live Streaming Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published Tracks</span>
                  <span className="font-semibold text-lg">
                    {eligibility.trackCount} / {eligibility.requiredTracks}
                  </span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${(eligibility.trackCount / eligibility.requiredTracks) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  You need <span className="font-semibold text-foreground">{tracksNeeded}</span> more track
                  {tracksNeeded !== 1 ? "s" : ""} to unlock live streaming
                </p>
              </div>
            </div>

            <Alert className="mb-6 bg-card/30 backdrop-blur-xl border-border/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Why do I need 3 tracks?</strong>
                <br />
                We require artists to have at least 3 published tracks to ensure quality content and build an audience
                before going live.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1 rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/25"
                size="lg"
              >
                <Link href="/dashboard/upload">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Tracks
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 rounded-full bg-card/20 backdrop-blur-xl hover:scale-105 transition-transform"
                size="lg"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
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
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full animate-pulse" />
              <Radio className="h-8 w-8 text-red-500 relative animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Start Live Stream
            </h1>
          </div>
          <p className="text-muted-foreground text-pretty">Set up your live stream details</p>
        </div>

        {eligibility?.eligible && (
          <Alert className="mb-6 bg-green-500/10 backdrop-blur-xl border-green-500/30 animate-fade-in">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              You're eligible to go live! You have {eligibility.trackCount} published tracks.
            </AlertDescription>
          </Alert>
        )}

        <Card
          className="bg-card/30 backdrop-blur-2xl border border-border/30 p-6 hover-lift animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base font-semibold">
                Stream Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g., Live Performance - New Album"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="mt-2 bg-background/50 backdrop-blur-xl border-border/50 focus:border-primary/50 transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/100 characters</p>
            </div>

            <div>
              <Label htmlFor="description" className="text-base font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Tell your audience what to expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                className="mt-2 bg-background/50 backdrop-blur-xl border-border/50 focus:border-primary/50 transition-all resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/500 characters</p>
            </div>

            <Alert className="bg-card/30 backdrop-blur-xl border-border/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-pretty">
                Make sure you have a stable internet connection and allow camera/microphone access when prompted.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleCreateStream}
              disabled={!title.trim() || loading}
              className="w-full rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/25"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
