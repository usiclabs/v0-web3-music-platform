"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Radio, Eye, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import * as Player from "@livepeer/react/player"

export default function WatchStreamPage() {
  const params = useParams()
  const router = useRouter()
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [livepeerActive, setLivepeerActive] = useState(false)

  useEffect(() => {
    const originalError = console.error
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || ""
      if (message.includes("Analytics SDK") || message.includes("AnalyticsSDKApiError")) {
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  useEffect(() => {
    async function loadStream() {
      const id = params.id as string

      if (id === "start" || id === "studio") {
        router.replace(`/live/${id}`)
        return
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        setError("Invalid stream ID")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/live/${id}`)
        if (!res.ok) throw new Error("Stream not found")

        const data = await res.json()
        console.log("[v0] Watch stream data loaded:", {
          id: data.id,
          title: data.title,
          playback_id: data.playback_id,
          is_live: data.is_live,
        })

        if (data.error) {
          setError(data.error)
          setStream(data)
        } else {
          setStream(data)
        }
      } catch (error: any) {
        console.error("[v0] Error loading stream:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadStream()

    const interval = setInterval(loadStream, 10000)
    return () => clearInterval(interval)
  }, [params.id, router])

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

  const playbackSrc = stream?.playback_id
    ? [
        {
          src: `https://livepeercdn.studio/hls/${stream.playback_id}/index.m3u8`,
          type: "application/vnd.apple.mpegurl" as const,
        },
      ]
    : null

  useEffect(() => {
    if (playbackSrc) {
      console.log("[v0] Playback source generated:", playbackSrc)
    } else if (stream) {
      console.log("[v0] No playback source - playback_id:", stream.playback_id)
    }
  }, [playbackSrc, stream])

  if (loading) {
    return (
      <div className="min-h-screen pb-32 bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen pb-32 bg-black flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Stream Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "This stream does not exist"}</p>
          <Button asChild>
            <Link href="/live">Back to Live</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-6 px-4 sm:px-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/live">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Live
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
              <div className="aspect-video bg-black relative">
                {playbackSrc ? (
                  <Player.Root
                    src={playbackSrc}
                    autoPlay
                    onError={(error) => {
                      console.error("[v0] Livepeer Player error:", error)
                      setPlayerError(error?.message || "Failed to load stream")
                    }}
                  >
                    <Player.Container className="h-full w-full">
                      <Player.Video className="h-full w-full" />

                      <Player.LoadingIndicator className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center text-white">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-sm">
                            {livepeerActive ? "Connecting to stream..." : "Waiting for broadcast to start..."}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {stream.is_live
                              ? livepeerActive
                                ? "Stream is active, loading video..."
                                : "The broadcaster needs to start streaming from their studio."
                              : "This stream is currently offline"}
                          </p>
                          {playerError && <p className="text-xs text-red-400 mt-2">Error: {playerError}</p>}
                        </div>
                      </Player.LoadingIndicator>

                      <Player.Controls className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center gap-4">
                          <Player.PlayPauseTrigger className="text-white hover:text-white/80 transition-colors">
                            <Player.PlayingIndicator matcher={false}>
                              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </Player.PlayingIndicator>
                            <Player.PlayingIndicator matcher={true}>
                              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                            </Player.PlayingIndicator>
                          </Player.PlayPauseTrigger>

                          <Player.Time className="text-white text-sm font-medium" />

                          <Player.Seek className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <Player.Track className="h-full bg-white/40 relative">
                              <Player.SeekBuffer className="absolute h-full bg-white/20" />
                              <Player.Range className="absolute h-full bg-primary" />
                            </Player.Track>
                          </Player.Seek>

                          <Player.MuteTrigger className="text-white hover:text-white/80 transition-colors">
                            <Player.VolumeIndicator matcher={false}>
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                                />
                              </svg>
                            </Player.VolumeIndicator>
                            <Player.VolumeIndicator matcher={true}>
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                              </svg>
                            </Player.VolumeIndicator>
                          </Player.MuteTrigger>

                          <Player.FullscreenTrigger className="text-white hover:text-white/80 transition-colors">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                              />
                            </svg>
                          </Player.FullscreenTrigger>
                        </div>
                      </Player.Controls>
                    </Player.Container>
                  </Player.Root>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <p className="text-lg font-semibold">Stream Not Available</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This stream is not properly configured (missing playback ID)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
                    {stream.description && <p className="text-muted-foreground text-sm">{stream.description}</p>}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {stream.is_live && (
                      <Badge className="bg-red-500 text-white border-0 animate-pulse">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                    )}
                    {livepeerActive && <Badge className="bg-green-500 text-white border-0">Broadcasting</Badge>}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {stream.artist ? (
                    <Link
                      href={`/artist/${stream.artist.wallet_address}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={stream.artist.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{stream.artist.artist_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {stream.artist.artist_name ||
                            `${stream.artist.wallet_address.slice(0, 6)}...${stream.artist.wallet_address.slice(-4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">Artist</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">Unknown Artist</p>
                        <p className="text-xs text-muted-foreground">Artist</p>
                      </div>
                    </div>
                  )}

                  {stream.is_live && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">{stream.viewer_count || 0} watching</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4">
              <h3 className="font-semibold mb-3">Stream Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {stream.is_live ? (
                      <span className="text-green-500">Live</span>
                    ) : (
                      <span className="text-muted-foreground">Offline</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Video Status:</span>
                  <p className="font-medium">
                    {livepeerActive ? (
                      <span className="text-green-500">Broadcasting</span>
                    ) : (
                      <span className="text-muted-foreground">No Video</span>
                    )}
                  </p>
                </div>
                {stream.started_at && (
                  <div>
                    <span className="text-muted-foreground">Started:</span>
                    <p className="font-medium">{new Date(stream.started_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
