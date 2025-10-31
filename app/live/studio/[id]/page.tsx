"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Radio, Eye, Loader2, AlertCircle, X, CheckCircle, Wifi, WifiOff, Video, VideoOff, Lock } from "lucide-react"
import * as Broadcast from "@livepeer/react/broadcast"
import { useBroadcastContext } from "@livepeer/react/broadcast"
import { createPublicClient, http, formatUnits } from "viem"
import { base } from "viem/chains"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import Link from "next/link"

function BroadcastStateTracker({ onStateChange }: { onStateChange: (enabled: boolean) => void }) {
  const broadcast = useBroadcastContext()

  useEffect(() => {
    if (broadcast?.enabled !== undefined) {
      console.log("[v0] Broadcast enabled state:", broadcast.enabled)
      onStateChange(broadcast.enabled)
    }
  }, [broadcast?.enabled, onStateChange])

  useEffect(() => {
    console.log("[v0] Full broadcast context:", {
      enabled: broadcast?.enabled,
      status: broadcast?.status,
      error: broadcast?.error,
    })
  }, [broadcast])

  return null
}

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useWallet()
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [livepeerActive, setLivepeerActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goingLive, setGoingLive] = useState(false)
  const [connectionHealth, setConnectionHealth] = useState<"good" | "poor" | "disconnected">("disconnected")
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [usiBalance, setUsiBalance] = useState<bigint | null>(null)
  const [checkingBalance, setCheckingBalance] = useState(true)

  const shouldCleanupRef = useRef(false)
  const cleanupInProgressRef = useRef(false)

  useEffect(() => {
    async function checkUsiBalance() {
      if (!address) {
        setCheckingBalance(false)
        return
      }

      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(),
        })

        const balance = await publicClient.readContract({
          address: USI_TOKEN_ADDRESS[8453] as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        })

        console.log("[v0] USI balance:", balance)
        setUsiBalance(balance as bigint)
      } catch (error) {
        console.error("[v0] Error checking USI balance:", error)
      } finally {
        setCheckingBalance(false)
      }
    }

    checkUsiBalance()
  }, [address])

  useEffect(() => {
    if (!stream?.id) return

    const checkLivepeerStatus = async () => {
      try {
        const res = await fetch(`/api/live/${stream.id}/livepeer-status`)
        if (res.ok) {
          const data = await res.json()
          console.log("[v0] Livepeer status:", data)
          setLivepeerActive(data.isActive)
        }
      } catch (error) {
        console.error("[v0] Error checking Livepeer status:", error)
      }
    }

    checkLivepeerStatus()
    const interval = setInterval(checkLivepeerStatus, 5000)
    return () => clearInterval(interval)
  }, [stream?.id])

  const endStreamCleanup = useCallback(async () => {
    if (cleanupInProgressRef.current || !shouldCleanupRef.current) return

    cleanupInProgressRef.current = true
    console.log("[v0] Cleaning up stream on unmount/leave")

    try {
      await fetch(`/api/live/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_live: false,
          ended_at: new Date().toISOString(),
        }),
      })
      console.log("[v0] Stream cleanup successful")
    } catch (error) {
      console.error("[v0] Error during stream cleanup:", error)
    } finally {
      cleanupInProgressRef.current = false
    }
  }, [params.id])

  useEffect(() => {
    return () => {
      if (shouldCleanupRef.current) {
        endStreamCleanup()
      }
    }
  }, [endStreamCleanup])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldCleanupRef.current) {
        const data = JSON.stringify({
          is_live: false,
          ended_at: new Date().toISOString(),
        })

        navigator.sendBeacon(`/api/live/${params.id}`, data)

        if (isLive) {
          e.preventDefault()
          e.returnValue = ""
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [params.id, isLive])

  useEffect(() => {
    async function loadStream() {
      try {
        const res = await fetch(`/api/live/${params.id}`)
        if (!res.ok) throw new Error("Stream not found")

        const data = await res.json()

        if (data.artist_address.toLowerCase() !== address?.toLowerCase()) {
          router.push("/live")
          return
        }

        setStream(data)
        setIsLive(data.is_live)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (address) {
      loadStream()
    }
  }, [params.id, address, router])

  async function handleGoLive() {
    console.log("[v0] Go Live button clicked, current state:", { goingLive, isBroadcasting, isLive })

    if (goingLive) return

    setGoingLive(true)
    try {
      const res = await fetch(`/api/live/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_live: true,
          started_at: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error("Failed to go live")

      setIsLive(true)
      shouldCleanupRef.current = true
      console.log("[v0] Successfully went live")
    } catch (error) {
      console.error("[v0] Error going live:", error)
      alert("Failed to go live. Please try again.")
    } finally {
      setGoingLive(false)
    }
  }

  async function handleEndStream() {
    if (!confirm("Are you sure you want to end this stream?")) return

    shouldCleanupRef.current = false

    try {
      const res = await fetch(`/api/live/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_live: false,
          ended_at: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error("Failed to end stream")

      router.push("/live")
    } catch (error) {
      console.error("[v0] Error ending stream:", error)
      alert("Failed to end stream. Please try again.")
    }
  }

  console.log("[v0] Stream key:", stream?.stream_key)

  const ingestUrl = stream?.stream_key ? `https://playback.livepeer.studio/webrtc/${stream.stream_key}` : null

  console.log("[v0] Ingest URL:", ingestUrl)

  const REQUIRED_USI_BALANCE = BigInt("100000000000000000000000000") // 100,000,000 * 10^18
  const hasEnoughUsi = usiBalance !== null && usiBalance >= REQUIRED_USI_BALANCE
  const formattedBalance = usiBalance ? formatUnits(usiBalance, 18) : "0"
  const formattedRequired = formatUnits(REQUIRED_USI_BALANCE, 18)

  if (loading) {
    return (
      <div className="min-h-screen pb-32 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-semibold">Loading broadcast studio...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen pb-32 bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Stream Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "Unable to load stream data"}</p>
          <Button onClick={() => router.push("/live")}>Back to Live Streams</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-6 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">{stream?.title || "Untitled Stream"}</h1>
              <p className="text-sm text-muted-foreground">Broadcast Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isBroadcasting && (
              <Badge
                className={`border-0 ${
                  connectionHealth === "good"
                    ? "bg-green-500"
                    : connectionHealth === "poor"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              >
                {connectionHealth === "good" ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {connectionHealth === "good"
                  ? "Connected"
                  : connectionHealth === "poor"
                    ? "Poor Connection"
                    : "Disconnected"}
              </Badge>
            )}
            {livepeerActive && (
              <Badge className="bg-green-500 text-white border-0">
                <Video className="h-3 w-3 mr-1" />
                Livepeer Receiving
              </Badge>
            )}
            {isLive && (
              <Badge className="bg-red-500 text-white border-0 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            {isBroadcasting && (
              <Badge className="bg-blue-500 text-white border-0">
                <Video className="h-3 w-3 mr-1" />
                Broadcasting
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => router.push("/live")}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
              <div className="aspect-video bg-black relative">
                {ingestUrl ? (
                  <Broadcast.Root ingestUrl={ingestUrl}>
                    <BroadcastStateTracker
                      onStateChange={(enabled) => {
                        console.log("[v0] Broadcast state changed:", enabled)
                        setIsBroadcasting(enabled)
                        setPermissionError(null)

                        if (enabled) {
                          setConnectionHealth("good")
                        } else {
                          setConnectionHealth("disconnected")
                        }
                      }}
                    />

                    <Broadcast.Container className="h-full w-full">
                      <Broadcast.Video className="h-full w-full object-cover" />

                      <Broadcast.Controls className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <Broadcast.EnabledIndicator
                            matcher={false}
                            className="flex items-center gap-2 text-sm text-white"
                          >
                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                            <span className="hidden sm:inline">Ready to broadcast</span>
                            <span className="sm:hidden">Ready</span>
                          </Broadcast.EnabledIndicator>

                          <Broadcast.EnabledIndicator
                            matcher={true}
                            className="flex items-center gap-2 text-sm text-white font-medium"
                          >
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="hidden sm:inline">Broadcasting Live</span>
                            <span className="sm:hidden">Live</span>
                          </Broadcast.EnabledIndicator>

                          <div className="flex gap-2">
                            <Broadcast.EnabledTrigger className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-all hover:scale-105 active:scale-95">
                              <Broadcast.EnabledIndicator matcher={false}>
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  <span className="hidden sm:inline">Start Broadcast</span>
                                  <span className="sm:hidden">Start</span>
                                </div>
                              </Broadcast.EnabledIndicator>
                              <Broadcast.EnabledIndicator matcher={true}>
                                <div className="flex items-center gap-2">
                                  <VideoOff className="h-4 w-4" />
                                  <span className="hidden sm:inline">Stop Broadcast</span>
                                  <span className="sm:hidden">Stop</span>
                                </div>
                              </Broadcast.EnabledIndicator>
                            </Broadcast.EnabledTrigger>
                          </div>
                        </div>
                      </Broadcast.Controls>

                      <Broadcast.LoadingIndicator className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-center text-white">
                          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                          <p className="text-lg font-semibold">Initializing broadcast...</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Please allow camera and microphone access
                          </p>
                        </div>
                      </Broadcast.LoadingIndicator>
                    </Broadcast.Container>
                  </Broadcast.Root>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center p-6">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <p className="text-lg font-semibold">Stream Not Configured</p>
                      <p className="text-sm text-muted-foreground mt-2">Unable to start broadcast</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{stream.viewer_count || 0} viewers</span>
                </div>

                <div className="flex gap-2">
                  {!isLive ? (
                    <div className="relative group">
                      <Button
                        onClick={handleGoLive}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={goingLive || checkingBalance || !hasEnoughUsi}
                      >
                        {checkingBalance ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : goingLive ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Going Live...
                          </>
                        ) : !hasEnoughUsi ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Go Live (Locked)
                          </>
                        ) : (
                          <>
                            <Radio className="h-4 w-4 mr-2" />
                            Go Live
                          </>
                        )}
                      </Button>
                      {!isBroadcasting && !goingLive && hasEnoughUsi && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Start broadcasting first
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
                        </div>
                      )}
                      {!hasEnoughUsi && !checkingBalance && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Requires 100M $USI tokens
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button onClick={handleEndStream} variant="destructive">
                      End Stream
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {!checkingBalance && !hasEnoughUsi && !isLive && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <Lock className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm">
                  <strong>Insufficient $USI Balance:</strong> You need at least{" "}
                  <span className="font-semibold">{Number(formattedRequired).toLocaleString()} $USI</span> tokens to go
                  live. Your current balance:{" "}
                  <span className="font-semibold">{Number(formattedBalance).toLocaleString()} $USI</span>.{" "}
                  <Link href="/swap" className="underline hover:text-yellow-400 transition-colors">
                    Get more $USI
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {!isLive && !isBroadcasting && !permissionError && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  <strong>Ready to go live?</strong> Click "Start Broadcast" to begin streaming your camera and audio,
                  then click "Go Live" to make your stream public.
                </AlertDescription>
              </Alert>
            )}

            {isBroadcasting && !livepeerActive && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm">
                  <strong>Connecting to Livepeer...</strong> Your camera is active but video hasn't reached Livepeer
                  yet. This usually takes 5-10 seconds.
                </AlertDescription>
              </Alert>
            )}

            {isBroadcasting && livepeerActive && !isLive && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-sm">
                  <strong>Broadcasting successfully!</strong> Livepeer is receiving your video. Click "Go Live" to make
                  your stream public so viewers can watch.
                </AlertDescription>
              </Alert>
            )}

            {isLive && !livepeerActive && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm">
                  <strong>Stream is live but no video detected!</strong> Click "Start Broadcast" to begin streaming your
                  camera and audio to viewers.
                </AlertDescription>
              </Alert>
            )}

            {isLive && livepeerActive && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-sm">
                  <strong>You're live!</strong> Your stream is public and Livepeer is broadcasting your video. Viewers
                  can now see and hear you.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4">
              <h3 className="font-semibold mb-3">Stream Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>
                  <p className="font-medium">{stream.title}</p>
                </div>
                {stream.description && (
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium">{stream.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {isLive ? (
                      <span className="text-red-500 flex items-center gap-1">
                        <Radio className="h-3 w-3" />
                        Live
                      </span>
                    ) : isBroadcasting ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Broadcasting (Not Public)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Offline</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Livepeer Status:</span>
                  <p className="font-medium">
                    {livepeerActive ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Receiving Video
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No Video</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>How to go live:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click "Start Broadcast" to begin streaming</li>
                  <li>Allow camera and microphone access</li>
                  <li>Wait for "Livepeer Receiving" badge (5-10 sec)</li>
                  <li>Click "Go Live" to make stream public</li>
                  <li>Viewers can now see and hear you</li>
                  <li>Click "End Stream" when finished</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Tips for success:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Ensure good lighting and stable internet</li>
                  <li>Test audio levels before going live</li>
                  <li>Position camera at eye level</li>
                  <li>Engage with viewers in real-time</li>
                  <li>Use a wired connection if possible</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>
    </div>
  )
}
