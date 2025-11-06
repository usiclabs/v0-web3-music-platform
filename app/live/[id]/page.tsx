"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Radio, Eye, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LivestreamChat } from "@/components/livestream-chat"

export default function WatchStreamPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [livepeerActive, setLivepeerActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [retryMessage, setRetryMessage] = useState<string>("")

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

  useEffect(() => {
    if (!stream?.playback_id || !videoRef.current) return

    const video = videoRef.current
    const hlsUrl = `https://livepeercdn.com/hls/${stream.playback_id}/index.m3u8`

    console.log("[v0] Setting up video player with HLS URL:", hlsUrl)

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    retryCountRef.current = 0
    setRetryMessage("")

    if (isSafari) {
      console.log("[v0] Using native HLS support (Safari)")
      video.src = hlsUrl
      video.load()
    } else {
      console.log("[v0] Loading HLS.js for video playback")

      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest"
      script.async = true

      script.onload = () => {
        if (window.Hls && window.Hls.isSupported()) {
          console.log("[v0] HLS.js loaded and supported")

          const initializeHls = () => {
            if (hlsRef.current) {
              hlsRef.current.destroy()
            }

            const hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
              maxBufferLength: 10,
              maxMaxBufferLength: 20,
            })

            hlsRef.current = hls

            hls.loadSource(hlsUrl)
            hls.attachMedia(video)

            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
              console.log("[v0] HLS manifest parsed successfully")
              setVideoLoading(false)
              setRetryMessage("")
              retryCountRef.current = 0
              video.play().catch((e) => {
                console.error("[v0] Autoplay failed:", e)
                setPlayerError("Click play to start the stream")
              })
            })

            hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
              console.error("[v0] HLS.js error:", { type: data.type, details: data.details, fatal: data.fatal })

              if (data.fatal) {
                switch (data.type) {
                  case window.Hls.ErrorTypes.NETWORK_ERROR:
                    if (data.details === "manifestParsingError" || data.details === "manifestLoadError") {
                      const maxRetries = 10
                      const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)

                      if (retryCountRef.current < maxRetries) {
                        retryCountRef.current++
                        console.log(
                          `[v0] Manifest not ready, retry ${retryCountRef.current}/${maxRetries} in ${retryDelay}ms`,
                        )
                        setRetryMessage(`Stream is starting... (attempt ${retryCountRef.current}/${maxRetries})`)

                        if (retryTimeoutRef.current) {
                          clearTimeout(retryTimeoutRef.current)
                        }

                        retryTimeoutRef.current = setTimeout(() => {
                          console.log("[v0] Retrying HLS initialization")
                          initializeHls()
                        }, retryDelay)
                      } else {
                        console.error("[v0] Max retries reached, giving up")
                        setPlayerError("Stream is not available. The broadcaster may not have started streaming yet.")
                        setVideoLoading(false)
                        setRetryMessage("")
                      }
                    } else {
                      console.error("[v0] Network error, trying to recover")
                      hls.startLoad()
                    }
                    break
                  case window.Hls.ErrorTypes.MEDIA_ERROR:
                    console.error("[v0] Media error, trying to recover")
                    hls.recoverMediaError()
                    break
                  default:
                    console.error("[v0] Fatal error, cannot recover")
                    setPlayerError("Stream playback error. Please refresh the page.")
                    setVideoLoading(false)
                    hls.destroy()
                    break
                }
              }
            })
          }

          initializeHls()
        } else {
          console.error("[v0] HLS.js not supported")
          setPlayerError("Your browser doesn't support HLS playback")
        }
      }

      script.onerror = () => {
        console.error("[v0] Failed to load HLS.js")
        setPlayerError("Failed to load video player")
      }

      document.head.appendChild(script)

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }
        if (hlsRef.current) {
          console.log("[v0] Cleaning up HLS.js")
          hlsRef.current.destroy()
          hlsRef.current = null
        }
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    }
  }, [stream?.playback_id])

  const handleVideoCanPlay = () => {
    console.log("[v0] Video can play")
    setVideoLoading(false)
    setPlayerError(null)
  }

  const handleVideoPlaying = () => {
    console.log("[v0] Video is playing")
    setIsPlaying(true)
    setVideoLoading(false)
  }

  const handleVideoWaiting = () => {
    console.log("[v0] Video is buffering")
    setVideoLoading(true)
  }

  const handleVideoError = (e: any) => {
    const video = e.target as HTMLVideoElement
    const error = video.error

    console.error("[v0] Video error event:", {
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      videoSrc: video.src,
      videoReadyState: video.readyState,
      videoNetworkState: video.networkState,
    })

    if (error) {
      let errorMessage = "Failed to load video stream"
      switch (error.code) {
        case 1:
          errorMessage = "Video loading was aborted. Please refresh to try again."
          break
        case 2:
          errorMessage = "Network error while loading video. Check your connection."
          break
        case 3:
          errorMessage = "Video format error. The stream may have encoding issues."
          break
        case 4:
          errorMessage = "Video source not supported. The stream may not be ready yet."
          break
      }

      setPlayerError(errorMessage)
    } else {
      console.error("[v0] Video error with no error object - stream may not be ready")
      setPlayerError("Stream is not ready yet. Please wait for the broadcaster to start streaming.")
    }

    setVideoLoading(false)
  }

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
            <Link href="/live">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Live
            </Link>
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

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
              <div className="aspect-video bg-black relative">
                {stream?.playback_id ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      autoPlay
                      playsInline
                      onCanPlay={handleVideoCanPlay}
                      onPlaying={handleVideoPlaying}
                      onWaiting={handleVideoWaiting}
                      onError={handleVideoError}
                    />

                    {videoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center text-white">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-sm">
                            {livepeerActive ? "Connecting to stream..." : "Waiting for broadcast to start..."}
                          </p>
                          {retryMessage && <p className="text-xs text-blue-400 mt-2">{retryMessage}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            {stream.is_live
                              ? livepeerActive
                                ? "Stream is active, loading video..."
                                : "The broadcaster needs to start streaming from their studio."
                              : "This stream is currently offline"}
                          </p>
                          {playerError && <p className="text-xs text-red-400 mt-2">{playerError}</p>}
                        </div>
                      </div>
                    )}
                  </>
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

          <div className="lg:col-span-1">
            <div className="sticky top-6 h-[calc(100vh-8rem)]">
              <LivestreamChat streamId={stream.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
