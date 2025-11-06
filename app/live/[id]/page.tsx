"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Radio, Eye, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Player } from "@livepeer/react"
import { LivestreamChat } from "@/components/livestream-chat"

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

  const playbackId = stream?.playback_id

  useEffect(() => {
    if (playbackId) {
      console.log("[v0] Using playback ID:", playbackId)
    } else if (stream) {
      console.log("[v0] No playback ID available")
    }
  }, [playbackId, stream])

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

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
              <div className="aspect-video bg-black relative">
                {playbackId ? (
                  <Player
                    playbackId={playbackId}
                    autoPlay
                    muted={false}
                    className="h-full w-full"
                    onError={(error) => {
                      console.error("[v0] Livepeer Player error:", error)
                      setPlayerError(error?.message || "Failed to load stream")
                    }}
                  />
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
