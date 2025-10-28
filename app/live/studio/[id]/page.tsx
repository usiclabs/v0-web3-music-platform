"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Radio, Eye, Loader2, AlertCircle, X } from "lucide-react"
import * as Broadcast from "@livepeer/react/broadcast"

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useWallet()
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStream() {
      try {
        const res = await fetch(`/api/live/${params.id}`)
        if (!res.ok) throw new Error("Stream not found")

        const data = await res.json()

        // Check if user owns this stream
        if (data.artist_address.toLowerCase() !== address?.toLowerCase()) {
          router.push("/live")
          return
        }

        setStream(data)
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
    try {
      await fetch(`/api/live/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_live: true,
          started_at: new Date().toISOString(),
        }),
      })
      setIsLive(true)
    } catch (error) {
      console.error("[v0] Error going live:", error)
    }
  }

  async function handleEndStream() {
    try {
      await fetch(`/api/live/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_live: false,
          ended_at: new Date().toISOString(),
        }),
      })
      router.push("/live")
    } catch (error) {
      console.error("[v0] Error ending stream:", error)
    }
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
          <p className="text-sm text-muted-foreground mb-6">{error || "This stream does not exist"}</p>
          <Button onClick={() => router.push("/live")}>Back to Live</Button>
        </Card>
      </div>
    )
  }

  const ingestUrl = `rtmp://rtmp.livepeer.com/live/${stream.stream_key}`
  console.log("[v0] Broadcast ingest URL:", ingestUrl)

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">{stream.title}</h1>
              <p className="text-sm text-muted-foreground">Broadcast Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLive && (
              <Badge className="bg-red-500 text-white border-0 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => router.push("/live")}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Broadcast Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Broadcast */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
              <div className="aspect-video bg-black relative">
                <Broadcast.Root ingestUrl={ingestUrl}>
                  <Broadcast.Container className="h-full w-full">
                    <Broadcast.Video className="h-full w-full" />

                    <Broadcast.Controls className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <Broadcast.EnabledIndicator
                          matcher={false}
                          className="flex items-center gap-2 text-sm text-white"
                        >
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          <span>Ready to broadcast</span>
                        </Broadcast.EnabledIndicator>

                        <Broadcast.EnabledIndicator
                          matcher={true}
                          className="flex items-center gap-2 text-sm text-white"
                        >
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Broadcasting</span>
                        </Broadcast.EnabledIndicator>

                        <div className="flex gap-2">
                          <Broadcast.EnabledTrigger className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors">
                            <Broadcast.EnabledIndicator matcher={false}>Start Broadcast</Broadcast.EnabledIndicator>
                            <Broadcast.EnabledIndicator matcher={true}>Stop Broadcast</Broadcast.EnabledIndicator>
                          </Broadcast.EnabledTrigger>
                        </div>
                      </div>
                    </Broadcast.Controls>
                  </Broadcast.Container>
                </Broadcast.Root>
              </div>

              {/* Controls */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{stream.viewer_count} viewers</span>
                </div>

                <div className="flex gap-2">
                  {!isLive ? (
                    <Button onClick={handleGoLive} className="bg-red-500 hover:bg-red-600">
                      <Radio className="h-4 w-4 mr-2" />
                      Go Live
                    </Button>
                  ) : (
                    <Button onClick={handleEndStream} variant="destructive">
                      End Stream
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Info Panel */}
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
              </div>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Tips for a great stream:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Ensure good lighting</li>
                  <li>Test your audio levels</li>
                  <li>Have a stable internet connection</li>
                  <li>Engage with your viewers</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>
    </div>
  )
}
