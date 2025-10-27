"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Plus, X, Upload, Loader2, Music, Video, Coins } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"
import { ensureProfile } from "@/lib/supabase/helpers"
import confetti from "canvas-confetti"
import { useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
import type { Address } from "viem"

interface RoyaltySplit {
  address: string
  percentage: number
}

export function UploadForm() {
  const router = useRouter()
  const { address } = useWallet()
  const publicClient = usePublicClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>("")

  const [contentType, setContentType] = useState<"audio" | "video">("audio")
  const [title, setTitle] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pricePerChunk, setPricePerChunk] = useState("0.005")
  const [unlockType, setUnlockType] = useState<"per_chunk" | "full_song">("per_chunk")
  const [royaltySplits, setRoyaltySplits] = useState<RoyaltySplit[]>([{ address: address || "", percentage: 100 }])

  const [tokenizeTrack, setTokenizeTrack] = useState(false)
  const [coinName, setCoinName] = useState("")
  const [coinSymbol, setCoinSymbol] = useState("")
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null)
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | null>(null)
  const [coinCreationStarted, setCoinCreationStarted] = useState(false)

  const { sendTransaction, data: txHash, reset: resetTx } = useSendTransaction()
  const {
    isLoading: isCoinCreating,
    isSuccess: isCoinCreated,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isCoinCreated && receipt && createdTrackId && coinCreationStarted) {
      ;(async () => {
        try {
          setUploadProgress("Coin created successfully!")
          console.log("[v0] Coin created, receipt:", receipt)

          const coinAddress = txHash

          const supabase = createBrowserClient()
          const { error: updateError } = await supabase
            .from("tracks")
            .update({ coin_address: coinAddress })
            .eq("id", createdTrackId)

          if (updateError) {
            console.error("[v0] Failed to update track with coin address:", updateError)
          } else {
            console.log("[v0] Track updated with coin address:", coinAddress)
          }

          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
            gravity: 1.2,
          })

          setTimeout(() => {
            setIsLoading(false)
            setUploadProgress("")
            setCoinCreationStarted(false)
            resetTx()
            router.push("/dashboard")
          }, 2000)
        } catch (err) {
          console.error("[v0] Error in coin creation success handler:", err)
          setError("Coin created but failed to update track. Please check your dashboard.")
          setIsLoading(false)
          setCoinCreationStarted(false)
        }
      })()
    }
  }, [isCoinCreated, receipt, createdTrackId, coinCreationStarted, txHash, router, resetTx])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (tokenizeTrack && !coinSymbol) {
      const symbol = newTitle
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 5)
      setCoinSymbol(symbol)
    }
    if (tokenizeTrack && !coinName) {
      setCoinName(newTitle)
    }
  }

  const addRoyaltySplit = () => {
    setRoyaltySplits([...royaltySplits, { address: "", percentage: 0 }])
  }

  const removeRoyaltySplit = (index: number) => {
    setRoyaltySplits(royaltySplits.filter((_, i) => i !== index))
  }

  const updateRoyaltySplit = (index: number, field: "address" | "percentage", value: string | number) => {
    const updated = [...royaltySplits]
    updated[index] = { ...updated[index], [field]: value }
    setRoyaltySplits(updated)
  }

  const totalPercentage = royaltySplits.reduce((sum, split) => sum + Number(split.percentage), 0)

  const createZoraCoin = async (trackId: string, coverImageUrl: string | null) => {
    if (!address || !tokenizeTrack) return

    try {
      setUploadProgress("Preparing coin creation...")
      setCoinCreationStarted(true)
      console.log("[v0] Creating Zora coin for track:", trackId)

      const response = await fetch("/api/coins/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creator: address,
          name: coinName || title,
          symbol: coinSymbol || title.slice(0, 5).toUpperCase(),
          metadata: {
            description: `Coin for ${contentType}: ${title}`,
          },
          coverImageUrl,
          trackId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to prepare coin transaction")
      }

      const { to, data, value } = await response.json()

      console.log("[v0] Transaction prepared:", { to, value })

      setUploadProgress("Please confirm the coin creation transaction in your wallet...")

      sendTransaction({
        to: to as Address,
        data: data as `0x${string}`,
        value: BigInt(value),
      })
    } catch (err) {
      console.error("[v0] Failed to create Zora coin:", err)
      setError(
        `Track uploaded successfully, but coin creation failed: ${err instanceof Error ? err.message : "Unknown error"}. You can create a coin later from your dashboard.`,
      )
      setCoinCreationStarted(false)

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/dashboard")
      }, 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUploadProgress("")
    resetTx()
    setCoinCreationStarted(false)
    setUploadedCoverUrl(null)

    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    if (!audioFile && !videoFile) {
      setError(`Please select ${contentType === "audio" ? "an audio" : "a video"} file`)
      return
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    const fileToCheck = contentType === "audio" ? audioFile : videoFile
    if (fileToCheck && fileToCheck.size > maxSize) {
      setError(`File size must be less than 50MB. Your file is ${(fileToCheck.size / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    if (totalPercentage !== 100) {
      setError("Royalty splits must total 100%")
      return
    }

    if (tokenizeTrack) {
      if (!coinName || !coinSymbol) {
        setError("Please provide coin name and symbol")
        return
      }
      if (coinSymbol.length < 2 || coinSymbol.length > 5) {
        setError("Coin symbol must be 2-5 characters")
        return
      }
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserClient()

      setUploadProgress("Creating profile...")
      const { error: profileError } = await ensureProfile(address)
      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      let mediaUrl: string
      let duration: number
      let thumbnailUrl: string | null = null

      if (contentType === "video" && videoFile) {
        setUploadProgress("Uploading video file...")
        console.log("[v0] Starting video upload:", videoFile.name, videoFile.size)

        const timestamp = Date.now()
        const filename = `${timestamp}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filePath = `videos/${filename}`

        const signedUrlResponse = await fetch("/api/storage/signed-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: "audio",
            filePath,
            contentType: videoFile.type,
          }),
        })

        if (!signedUrlResponse.ok) {
          const errorText = await signedUrlResponse.text()
          throw new Error(`Failed to get upload URL: ${errorText}`)
        }

        const { signedUrl, path } = await signedUrlResponse.json()

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: videoFile,
          headers: {
            "Content-Type": videoFile.type,
            "x-upsert": "false",
          },
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error("[v0] Video upload error:", errorText)
          throw new Error(`Video upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("audio").getPublicUrl(path)
        mediaUrl = publicUrl
        console.log("[v0] Video uploaded successfully:", mediaUrl)

        setUploadProgress("Processing video metadata...")
        const video = document.createElement("video")
        video.src = URL.createObjectURL(videoFile)
        await new Promise((resolve) => {
          video.addEventListener("loadedmetadata", resolve)
        })
        duration = Math.floor(video.duration)

        if (coverFile) {
          setUploadProgress("Uploading thumbnail...")
          console.log("[v0] Uploading video thumbnail:", coverFile.name)

          const thumbFormData = new FormData()
          thumbFormData.append("file", coverFile)
          thumbFormData.append("bucket", "covers")

          try {
            const thumbResponse = await fetch("/api/upload/image", {
              method: "POST",
              body: thumbFormData,
            })

            if (thumbResponse.ok) {
              const thumbResult = await thumbResponse.json()
              thumbnailUrl = thumbResult.url
              setUploadedCoverUrl(thumbnailUrl)
              console.log("[v0] Thumbnail uploaded successfully:", thumbnailUrl)
            } else {
              const errorText = await thumbResponse.text()
              console.error("[v0] Thumbnail upload failed:", errorText)
            }
          } catch (thumbError) {
            console.error("[v0] Thumbnail upload error:", thumbError)
          }
        }
      } else if (contentType === "audio" && audioFile) {
        setUploadProgress("Uploading audio file...")
        console.log("[v0] Starting audio upload:", audioFile.name, audioFile.size)

        const timestamp = Date.now()
        const filename = `${timestamp}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filePath = `audio/${filename}`

        const signedUrlResponse = await fetch("/api/storage/signed-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: "audio",
            filePath,
            contentType: audioFile.type,
          }),
        })

        if (!signedUrlResponse.ok) {
          const errorText = await signedUrlResponse.text()
          throw new Error(`Failed to get upload URL: ${errorText}`)
        }

        const { signedUrl, path } = await signedUrlResponse.json()

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: audioFile,
          headers: {
            "Content-Type": audioFile.type,
            "x-upsert": "false",
          },
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error("[v0] Audio upload error:", errorText)
          throw new Error(`Audio upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("audio").getPublicUrl(path)
        mediaUrl = publicUrl
        console.log("[v0] Audio uploaded successfully:", mediaUrl)

        if (coverFile) {
          setUploadProgress("Uploading cover image...")
          const coverFormData = new FormData()
          coverFormData.append("file", coverFile)
          coverFormData.append("bucket", "covers")

          const coverResponse = await fetch("/api/upload/image", {
            method: "POST",
            body: coverFormData,
          })

          if (coverResponse.ok) {
            const coverResult = await coverResponse.json()
            thumbnailUrl = coverResult.url
            setUploadedCoverUrl(thumbnailUrl)
          }
        }

        setUploadProgress("Processing audio metadata...")
        const audio = new Audio(URL.createObjectURL(audioFile))
        await new Promise((resolve) => {
          audio.addEventListener("loadedmetadata", resolve)
        })
        duration = Math.floor(audio.duration)
      } else {
        throw new Error("Invalid content type or missing file")
      }

      setUploadProgress("Saving track metadata...")
      const createResponse = await fetch("/api/tracks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          artist_id: address.toLowerCase(),
          content_type: contentType,
          audio_url: contentType === "audio" ? mediaUrl : null,
          video_url: contentType === "video" ? mediaUrl : null,
          cover_url: contentType === "audio" ? thumbnailUrl : null,
          thumbnail_url: contentType === "video" ? thumbnailUrl : null,
          duration,
          price_per_chunk: Number.parseFloat(pricePerChunk),
          unlock_type: unlockType,
          royalty_splits: royaltySplits.map((split) => ({
            address: split.address,
            percentage: split.percentage,
          })),
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || "Failed to create track")
      }

      const { track } = await createResponse.json()
      console.log("[v0] Track created successfully:", track.id)
      setCreatedTrackId(track.id)

      if (tokenizeTrack) {
        try {
          await createZoraCoin(track.id, uploadedCoverUrl)
          return
        } catch (coinError) {
          console.error("[v0] Coin creation failed, but track uploaded:", coinError)
          // Continue to success flow even if coin creation fails
        }
      }

      setUploadProgress("Upload complete!")

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
      })

      setTimeout(() => {
        setIsLoading(false)
        setUploadProgress("")
        setCoinCreationStarted(false)
        resetTx()
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      console.error("[v0] Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload track")
      setIsLoading(false)
      setUploadProgress("")
      setCoinCreationStarted(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">Content Type</h2>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setContentType("audio")}
            className={`flex-1 p-6 rounded-lg border-2 transition-all ${
              contentType === "audio" ? "border-accent bg-accent/10" : "border-border/50 bg-card/30 hover:border-border"
            }`}
          >
            <Music className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold mb-1">Audio Track</div>
            <div className="text-sm text-muted-foreground">Upload music or audio content</div>
          </button>
          <button
            type="button"
            onClick={() => setContentType("video")}
            className={`flex-1 p-6 rounded-lg border-2 transition-all ${
              contentType === "video" ? "border-accent bg-accent/10" : "border-border/50 bg-card/30 hover:border-border"
            }`}
          >
            <Video className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold mb-1">Video Content</div>
            <div className="text-sm text-muted-foreground">Upload video with pay-per-view</div>
          </button>
        </div>
      </Card>

      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">{contentType === "audio" ? "Track" : "Video"} Details</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">{contentType === "audio" ? "Track" : "Video"} Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={`Enter ${contentType} title`}
              required
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
          </div>

          {contentType === "audio" ? (
            <div>
              <Label htmlFor="audio">Audio File</Label>
              <Input
                id="audio"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac,audio/ogg,audio/x-m4a,.mp3,.wav,.flac,.aac,.ogg,.m4a"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                required
                className="bg-card/50 backdrop-blur-xl border border-border/50"
              />
              {audioFile && <p className="text-sm text-muted-foreground mt-2">{audioFile.name}</p>}
            </div>
          ) : (
            <div>
              <Label htmlFor="video">Video File</Label>
              <Input
                id="video"
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
                className="bg-card/50 backdrop-blur-xl border border-border/50"
              />
              {videoFile && <p className="text-sm text-muted-foreground mt-2">{videoFile.name}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: MP4, MOV, AVI, MKV, WebM (max 500MB)
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="cover">{contentType === "audio" ? "Cover Image" : "Thumbnail"} (Optional)</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
            {coverFile && <p className="text-sm text-muted-foreground mt-2">{coverFile.name}</p>}
          </div>

          <div>
            <Label>Unlock Type</Label>
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={() => setUnlockType("per_chunk")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  unlockType === "per_chunk"
                    ? "border-accent bg-accent/10"
                    : "border-border/50 bg-card/30 hover:border-border"
                }`}
              >
                <div className="font-semibold mb-1">Per Segment</div>
                <div className="text-sm text-muted-foreground">Users pay for each 30s segment</div>
              </button>
              <button
                type="button"
                onClick={() => setUnlockType("full_song")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  unlockType === "full_song"
                    ? "border-accent bg-accent/10"
                    : "border-border/50 bg-card/30 hover:border-border"
                }`}
              >
                <div className="font-semibold mb-1">Full {contentType === "audio" ? "Song" : "Video"}</div>
                <div className="text-sm text-muted-foreground">One payment unlocks entire {contentType}</div>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="price">
              {unlockType === "per_chunk"
                ? "Price per 30s Segment (USDC)"
                : `Price to Unlock Full ${contentType === "audio" ? "Song" : "Video"} (USDC)`}
            </Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min="0"
              value={pricePerChunk}
              onChange={(e) => setPricePerChunk(e.target.value)}
              placeholder={unlockType === "per_chunk" ? "0.005" : contentType === "video" ? "0.50" : "0.15"}
              required
              className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {unlockType === "per_chunk"
                ? "Recommended: 0.005 USDC (0.5¢ per 30s)"
                : contentType === "video"
                  ? "Recommended: 0.50 USDC (50¢ for full video)"
                  : "Recommended: 0.15 USDC (15¢ for full song)"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-accent" />
            <div>
              <h2 className="text-xl font-semibold">Tokenize Your {contentType === "audio" ? "Track" : "Video"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create a coin on Zora for your {contentType} (powered by Base)
              </p>
            </div>
          </div>
          <Switch checked={tokenizeTrack} onCheckedChange={setTokenizeTrack} />
        </div>

        {tokenizeTrack && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Creating a coin allows fans to invest in your {contentType}. They can buy, sell, and trade your coin on
                Zora, creating a market for your work.
              </p>
            </div>

            <div>
              <Label htmlFor="coinName">Coin Name</Label>
              <Input
                id="coinName"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                placeholder={`e.g., ${title || "My Awesome Track"}`}
                required={tokenizeTrack}
                className="bg-card/50 backdrop-blur-xl border border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">The full name of your coin</p>
            </div>

            <div>
              <Label htmlFor="coinSymbol">Coin Symbol (Ticker)</Label>
              <Input
                id="coinSymbol"
                value={coinSymbol}
                onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., TRACK"
                maxLength={5}
                required={tokenizeTrack}
                className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">2-5 characters (auto-generated from title)</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">Base</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">ETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Starting Market Cap:</span>
                <span className="font-medium">Low (Accessible)</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Royalty Splits</h2>
          <Button type="button" variant="outline" size="sm" onClick={addRoyaltySplit} className="bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Split
          </Button>
        </div>

        <div className="space-y-4">
          {royaltySplits.map((split, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor={`address-${index}`} className="sr-only">
                  Wallet Address
                </Label>
                <Input
                  id={`address-${index}`}
                  value={split.address}
                  onChange={(e) => updateRoyaltySplit(index, "address", e.target.value)}
                  placeholder="0x..."
                  required
                  className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
                />
              </div>
              <div className="w-24">
                <Label htmlFor={`percentage-${index}`} className="sr-only">
                  Percentage
                </Label>
                <Input
                  id={`percentage-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={split.percentage}
                  onChange={(e) => updateRoyaltySplit(index, "percentage", Number.parseInt(e.target.value) || 0)}
                  placeholder="%"
                  required
                  className="bg-card/50 backdrop-blur-xl border border-border/50"
                />
              </div>
              {royaltySplits.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRoyaltySplit(index)}
                  className="h-10 w-10 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className={totalPercentage === 100 ? "text-accent font-semibold" : "text-destructive font-semibold"}>
            {totalPercentage}%
          </span>
        </div>
      </Card>

      {uploadProgress && (
        <div className="bg-card/80 backdrop-blur-2xl border border-accent/50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            {(isLoading || isCoinCreating) && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
            <p className="text-sm text-accent">{uploadProgress}</p>
          </div>
          {txHash && isCoinCreating && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-accent mt-2 block"
            >
              View transaction on BaseScan →
            </a>
          )}
        </div>
      )}

      {error && (
        <div className="bg-card/80 backdrop-blur-2xl border border-destructive/50 p-4 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading || isCoinCreating}
          className="bg-transparent"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isCoinCreating} className="flex-1">
          {isLoading || isCoinCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isCoinCreating ? "Creating Coin..." : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {contentType === "audio" ? "Track" : "Video"}
              {tokenizeTrack && " & Create Coin"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
