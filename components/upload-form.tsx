"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, X, Upload, Loader2, Music, Video, Coins, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"
import { ensureProfile } from "@/lib/supabase/helpers"
import confetti from "canvas-confetti"
import { useSendTransaction, useWaitForTransactionReceipt, usePublicClient, useReadContract, useChainId } from "wagmi"
import type { Address } from "viem"
import { formatUnits } from "viem"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { REQUIRED_TOKEN_BALANCE, formatTokenBalance } from "@/lib/web3/token-gate"

interface RoyaltySplit {
  address: string
  percentage: number
}

interface UploadFormProps {
  prefillData?: {
    audioUrl?: string
    title?: string
    coverUrl?: string
    style?: string
    prompt?: string
    videoUrl?: string
  } | null
}

export function UploadForm({ prefillData }: UploadFormProps) {
  const router = useRouter()
  const { address } = useWallet()
  const publicClient = usePublicClient()
  const chainId = useChainId()
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
  const [deploymentMethod, setDeploymentMethod] = useState<"zora" | "clanker">("clanker")
  const [coinName, setCoinName] = useState("")
  const [coinSymbol, setCoinSymbol] = useState("")
  const [tokenGatedStreaming, setTokenGatedStreaming] = useState(false)
  const [requiredTokenBalance, setRequiredTokenBalance] = useState("100")
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null)
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | null>(null)
  const [coinCreationStarted, setCoinCreationStarted] = useState(false)
  const [isCoinCreated, setIsCoinCreated] = useState(false)
  const [receipt, setReceipt] = useState<any | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isGeneratingGif, setIsGeneratingGif] = useState(false)
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null)

  const [prefilledAudioUrl, setPrefilledAudioUrl] = useState<string | null>(null)
  const [prefilledCoverUrl, setPrefilledCoverUrl] = useState<string | null>(null)
  const [prefilledVideoUrl, setPrefilledVideoUrl] = useState<string | null>(null)

  const { data: usiBalance } = useReadContract({
    address: chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!chainId,
    },
  })

  const hasRequiredUSI = usiBalance ? (usiBalance as bigint) >= REQUIRED_TOKEN_BALANCE : false
  const usiBalanceFormatted = usiBalance ? formatUnits(usiBalance as bigint, 18) : "0"
  const requiredBalanceFormatted = formatTokenBalance(REQUIRED_TOKEN_BALANCE)

  const { sendTransaction } = useSendTransaction()
  const { data: transactionReceipt, isFetching: isCoinCreating } = useWaitForTransactionReceipt({
    hash: txHash ? txHash : undefined,
    onSuccess: (receipt) => {
      setIsCoinCreated(true)
      setReceipt(receipt)
    },
    onError: (error) => {
      console.error("[v0] Transaction error:", error)
      setError("Transaction failed. Please try again.")
      setIsLoading(false)
      setCoinCreationStarted(false)
      setTxHash(null)
    },
  })

  useEffect(() => {
    console.log("[v0] Upload form - Wallet address:", address)
    console.log("[v0] Upload form - Chain ID:", chainId)
    console.log(
      "[v0] Upload form - $USI token address:",
      chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : "undefined",
    )
    console.log("[v0] Upload form - $USI balance (raw):", usiBalance)
    console.log("[v0] Upload form - $USI balance (formatted):", usiBalanceFormatted)
    console.log("[v0] Upload form - Has required $USI:", hasRequiredUSI)
    console.log("[v0] Upload form - Required balance:", requiredBalanceFormatted)
  }, [address, chainId, usiBalance, usiBalanceFormatted, hasRequiredUSI, requiredBalanceFormatted])

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
            setIsCoinCreated(false)
            setTxHash(null)
            router.push("/dashboard")
          }, 2000)
        } catch (err) {
          console.error("[v0] Error in coin creation success handler:", err)
          setError("Coin created but failed to update track. Please check your dashboard.")
          setIsLoading(false)
          setCoinCreationStarted(false)
          setIsCoinCreated(false)
          setTxHash(null)
        }
      })()
    }
  }, [isCoinCreated, receipt, createdTrackId, coinCreationStarted, txHash, router])

  useEffect(() => {
    if (prefillData) {
      if (prefillData.title) setTitle(prefillData.title)
      if (prefillData.audioUrl) setPrefilledAudioUrl(prefillData.audioUrl)
      if (prefillData.coverUrl) setPrefilledCoverUrl(prefillData.coverUrl)
      if (prefillData.videoUrl) {
        setPrefilledVideoUrl(prefillData.videoUrl)
        setContentType("video")
      }
      // Auto-generate coin name/symbol from title
      if (prefillData.title) {
        setCoinName(prefillData.title)
        const symbol = prefillData.title
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 5)
        setCoinSymbol(`$${symbol}`)
      }
    }
  }, [prefillData])

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

  const createClankerToken = async (trackId: string, coverImageUrl: string | null) => {
    if (!address || !tokenizeTrack) return

    try {
      setUploadProgress("Deploying token via Clanker...")
      setCoinCreationStarted(true)
      console.log("[v0] Creating Clanker token for track:", trackId)

      const response = await fetch("/api/tokens/deploy-clanker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: coinName || title,
          symbol: coinSymbol || title.slice(0, 5).toUpperCase(),
          deployerAddress: address,
          trackId,
          coverImageUrl,
        }),
      })

      const responseText = await response.text()
      let responseData

      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        // If response is not JSON, use the text as error message
        throw new Error(responseText || "Failed to deploy token via Clanker")
      }

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to deploy token via Clanker")
      }

      const { tokenAddress } = responseData
      console.log("[v0] Clanker token deployed:", tokenAddress)

      setUploadProgress("Token deployed successfully!")

      const supabase = createBrowserClient()
      const { error: updateError } = await supabase
        .from("tracks")
        .update({ coin_address: tokenAddress })
        .eq("id", trackId)

      if (updateError) {
        console.error("[v0] Failed to update track with token address:", updateError)
        throw new Error("Failed to save token address")
      }

      console.log("[v0] Track updated with token address:", tokenAddress)

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
        setIsCoinCreated(false)
        setTxHash(null)
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error("[v0] Failed to create Clanker token:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(
        `✅ Track uploaded successfully! However, token deployment failed: ${errorMessage}\n\nYou can try deploying the token again from your dashboard, or contact support if the issue persists.`,
      )
      setCoinCreationStarted(false)

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
        gravity: 1.2,
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/dashboard")
      }, 3000)
    }
  }

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
      }).then((tx) => setTxHash(tx.hash))
    } catch (err) {
      console.error("[v0] Failed to create Zora coin:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`✅ Track uploaded successfully! However, coin creation failed: ${errorMessage}`)
      setCoinCreationStarted(false)

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
        gravity: 1.2,
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/dashboard")
      }, 3000)
    }
  }

  const handleVideoFileChange = (file: File | null) => {
    setVideoFile(file)
    // Reset GIF preview when video changes
    if (!coverFile) {
      setGifPreviewUrl(null)
    }
  }

  const handleCoverFileChange = (file: File | null) => {
    if (file) {
      const maxSize = 15 * 1024 * 1024 // 15MB
      if (file.size > maxSize) {
        setError(
          `Thumbnail file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 15MB. Please compress your GIF using tools like ezgif.com`,
        )
        return
      }
      // Clear any previous errors
      setError(null)
    }
    setCoverFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUploadProgress("")
    setIsCoinCreated(false)
    setTxHash(null)
    setCoinCreationStarted(false)
    setUploadedCoverUrl(null)

    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    if (!audioFile && !videoFile && !prefilledAudioUrl && !prefilledVideoUrl) {
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
        setError("Please provide token name and symbol")
        return
      }
      if (coinSymbol.length < 2 || coinSymbol.length > 5) {
        setError("Token symbol must be 2-5 characters")
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
      const thumbnailUrl: string | null = null

      // Use prefilled URLs if no file is uploaded
      let currentAudioUrl = prefilledAudioUrl
      let currentVideoUrl = prefilledVideoUrl
      let currentCoverUrl = prefilledCoverUrl || uploadedCoverUrl // Use existing uploaded cover if available

      if (contentType === "video") {
        if (!videoFile && !prefilledVideoUrl) {
          throw new Error("Please upload a video file or provide a prefilled URL.")
        }

        if (videoFile) {
          setUploadProgress("Uploading video...")
          console.log("[v0] Starting video upload:", videoFile.name, videoFile.size)

          const timestamp = Date.now()
          const filePath = `videos/${timestamp}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

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

          const { data: uploadSuccessData } = supabase.storage.from("audio").getPublicUrl(path)
          mediaUrl = uploadSuccessData.publicUrl
          currentVideoUrl = mediaUrl // Update currentVideoUrl with the uploaded URL
          console.log("[v0] Video uploaded successfully:", mediaUrl)
        } else {
          mediaUrl = prefilledVideoUrl! // Use prefilled URL if no file uploaded
          currentVideoUrl = mediaUrl
          console.log("[v0] Using prefilled video URL:", mediaUrl)
        }

        setUploadProgress("Processing video metadata...")
        const video = document.createElement("video")
        video.src = mediaUrl // Use the determined mediaUrl
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
              currentCoverUrl = thumbResult.url
              setUploadedCoverUrl(currentCoverUrl)
              console.log("[v0] Thumbnail uploaded successfully:", currentCoverUrl)
            } else {
              const errorText = await thumbResponse.text()
              console.error("[v0] Thumbnail upload failed:", errorText)
            }
          } catch (thumbError) {
            console.error("[v0] Thumbnail upload error:", thumbError)
          }
        } else if (gifPreviewUrl) {
          // Use the generated GIF as thumbnail
          currentCoverUrl = gifPreviewUrl
          setUploadedCoverUrl(currentCoverUrl)
          console.log("[v0] Using generated GIF as thumbnail:", currentCoverUrl)
        }
      } else if (contentType === "audio") {
        // In the audio file input section, show prefilled state
        if (prefilledAudioUrl && !audioFile) {
          ;<div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Music className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-500">AI-Generated Audio Ready</p>
                <p className="text-xs text-muted-foreground">Audio from AI Studio will be used</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPrefilledAudioUrl(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <audio src={prefilledAudioUrl} controls className="w-full mt-3 h-10" />
          </div>
        } else {
          if (!audioFile) {
            throw new Error("Please upload an audio file or provide a prefilled URL.")
          }

          setUploadProgress("Uploading audio...")
          console.log("[v0] Starting audio upload:", audioFile.name, audioFile.size)

          const timestamp = Date.now()
          const filePath = `audio/${timestamp}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

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

          const { data: uploadSuccessData } = supabase.storage.from("audio").getPublicUrl(path)
          mediaUrl = uploadSuccessData.publicUrl
          currentAudioUrl = mediaUrl // Update currentAudioUrl with the uploaded URL
          console.log("[v0] Audio uploaded successfully:", mediaUrl)
        }

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
            currentCoverUrl = coverResult.url
            setUploadedCoverUrl(currentCoverUrl)
          } else {
            const errorText = await coverResponse.text()
            console.error("[v0] Cover upload failed:", errorText)
          }
        }

        setUploadProgress("Processing audio metadata...")
        const audio = new Audio(mediaUrl) // Use the determined mediaUrl
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
          audio_url: contentType === "audio" ? currentAudioUrl : null,
          video_url: contentType === "video" ? currentVideoUrl : null,
          cover_url: contentType === "audio" ? currentCoverUrl : null,
          thumbnail_url: contentType === "video" ? currentCoverUrl : null,
          duration,
          price_per_chunk: Number.parseFloat(pricePerChunk),
          unlock_type: unlockType,
          token_gated_streaming: tokenizeTrack && tokenGatedStreaming,
          required_token_balance: tokenizeTrack && tokenGatedStreaming ? Number.parseFloat(requiredTokenBalance) : 0,
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
          if (deploymentMethod === "clanker") {
            await createClankerToken(track.id, currentCoverUrl) // Pass the final cover URL
          } else {
            await createZoraCoin(track.id, currentCoverUrl) // Pass the final cover URL
          }
          return
        } catch (coinError) {
          console.error("[v0] Token creation failed, but track uploaded:", coinError)
          // Continue to success flow even if token creation fails
        }
      }

      setUploadProgress("Upload complete!")

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
        gravity: 1.2,
      })

      setTimeout(() => {
        setIsLoading(false)
        setUploadProgress("")
        setCoinCreationStarted(false)
        setIsCoinCreated(false)
        setTxHash(null)
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      console.error("[v0] Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload track")
      setIsLoading(false)
      setUploadProgress("")
      setCoinCreationStarted(false)
      setIsCoinCreated(false)
      setTxHash(null)
    }
  }

  const resetTx = () => {
    setTxHash(null)
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

          {contentType === "video" ? (
            <div>
              <Label htmlFor="video">Video File</Label>
              <Input
                id="video"
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm"
                onChange={(e) => handleVideoFileChange(e.target.files?.[0] || null)}
                required={!(prefilledVideoUrl && !videoFile)}
                className="bg-card/50 backdrop-blur-xl border border-border/50"
              />
              {videoFile && <p className="text-sm text-muted-foreground mt-2">{videoFile.name}</p>}
              {prefilledVideoUrl && !videoFile && (
                <p className="text-sm text-muted-foreground mt-2">{prefilledVideoUrl}</p>
              )}
              {gifPreviewUrl && (
                <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                  <p className="text-xs text-accent mb-2">✓ Preview GIF generated automatically</p>
                  <img
                    src={gifPreviewUrl || "/placeholder.svg"}
                    alt="Video preview"
                    className="rounded-md max-w-[200px]"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: MP4, MOV, AVI, MKV, WebM (max 50MB)
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="audio">Audio File</Label>
              {prefilledAudioUrl && !audioFile ? (
                <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Music className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-500">AI-Generated Audio Ready</p>
                      <p className="text-xs text-muted-foreground">Audio from AI Studio will be used</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrefilledAudioUrl(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <audio src={prefilledAudioUrl} controls className="w-full mt-3 h-10" />
                </div>
              ) : (
                <>
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    required={!prefilledAudioUrl}
                    className="bg-card/50 backdrop-blur-xl border border-border/50"
                  />
                  {audioFile && <p className="text-sm text-muted-foreground mt-2">{audioFile.name}</p>}
                </>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="cover">Cover Art (Optional)</Label>
            {prefilledCoverUrl && !coverFile ? (
              <div className="mt-2 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={prefilledCoverUrl || "/placeholder.svg"}
                    alt="AI Generated Cover"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent">AI-Generated Cover Art</p>
                    <p className="text-xs text-muted-foreground">Cover from AI Studio will be used</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrefilledCoverUrl(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverFileChange(e.target.files?.[0] || null)}
                  className="bg-card/50 backdrop-blur-xl border border-border/50"
                />
                {coverFile && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">{coverFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(coverFile.size / 1024 / 1024).toFixed(2)}MB
                      {coverFile.size > 10 * 1024 * 1024 && " (Large file - consider compressing)"}
                    </p>
                  </div>
                )}
              </>
            )}
            {contentType === "video" && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Upload an animated GIF for an eye-catching looping preview! Maximum size: 15MB. You can create
                and compress GIFs using{" "}
                <a
                  href="https://ezgif.com/video-to-gif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ezgif.com
                </a>{" "}
                or{" "}
                <a
                  href="https://gifski.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Gifski
                </a>
                .
              </p>
            )}
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
              <p className="text-sm text-muted-foreground mt-1">Create a tradeable token for your {contentType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasRequiredUSI && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Requires 0.1% $USI</span>
              </div>
            )}
            <Switch checked={tokenizeTrack} onCheckedChange={setTokenizeTrack} disabled={!hasRequiredUSI} />
          </div>
        </div>

        {!hasRequiredUSI && (
          <div className="bg-muted/30 border border-border/50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Token-Gated Feature</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  This feature requires holding at least{" "}
                  <span className="font-semibold text-accent">0.1% of the total $USI supply</span> (
                  {requiredBalanceFormatted} $USI) to access.
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Your balance:</span>
                  <span className="font-mono font-semibold">
                    {Number.parseFloat(usiBalanceFormatted).toLocaleString()} $USI
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/swap")}
                  className="mt-3 w-full bg-transparent"
                >
                  Get $USI Tokens →
                </Button>
              </div>
            </div>
          </div>
        )}

        {tokenizeTrack && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div>
              <Label className="mb-3 block">Deployment Method</Label>
              <RadioGroup
                value={deploymentMethod}
                onValueChange={(value) => setDeploymentMethod(value as "zora" | "clanker")}
              >
                <div className="grid grid-cols-1 gap-4">
                  {false && (
                    <div
                      className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        deploymentMethod === "zora"
                          ? "border-accent bg-accent/10"
                          : "border-border/50 bg-card/30 hover:border-border"
                      }`}
                    >
                      <RadioGroupItem value="zora" id="zora" className="mt-1" />
                      <Label htmlFor="zora" className="flex-1 cursor-pointer">
                        <div className="font-semibold mb-1">Zora</div>
                        <div className="text-xs text-muted-foreground">
                          Create a coin on Zora with custom bonding curve
                        </div>
                      </Label>
                    </div>
                  )}
                  <div
                    className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      deploymentMethod === "clanker"
                        ? "border-accent bg-accent/10"
                        : "border-border/50 bg-card/30 hover:border-border"
                    }`}
                  >
                    <RadioGroupItem value="clanker" id="clanker" className="mt-1" />
                    <Label htmlFor="clanker" className="flex-1 cursor-pointer">
                      <div className="font-semibold mb-1">Clanker</div>
                      <div className="text-xs text-muted-foreground">Deploy ERC20 with auto Uniswap v4 pool</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Clanker deploys a standard ERC20 token with automatic Uniswap v4 liquidity pool creation, making your
                token instantly tradeable with fair price distribution.
              </p>
            </div>

            <div>
              <Label htmlFor="coinName">Token Name</Label>
              <Input
                id="coinName"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                placeholder={`e.g., ${title || "My Awesome Track"}`}
                required={tokenizeTrack}
                className="bg-card/50 backdrop-blur-xl border border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">The full name of your token</p>
            </div>

            <div>
              <Label htmlFor="coinSymbol">Token Symbol (Ticker)</Label>
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
                <span className="text-muted-foreground">Configuration:</span>
                <span className="font-medium">Low Preset (Recommended)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Liquidity Pool:</span>
                <span className="font-medium">Uniswap v4 (Auto)</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-semibold text-sm">Token-Gated Free Streaming</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Let token holders stream for free</p>
                  </div>
                </div>
                <Switch checked={tokenGatedStreaming} onCheckedChange={setTokenGatedStreaming} />
              </div>

              {tokenGatedStreaming && (
                <div className="space-y-3 pt-3 border-t border-border/30">
                  <div>
                    <Label htmlFor="requiredTokenBalance" className="text-sm">
                      Required Token Balance
                    </Label>
                    <Input
                      id="requiredTokenBalance"
                      type="number"
                      min="1"
                      step="1"
                      value={requiredTokenBalance}
                      onChange={(e) => setRequiredTokenBalance(e.target.value)}
                      placeholder="100"
                      className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Minimum tokens a listener must hold to bypass X402 payments
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-md p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Token holders with {requiredTokenBalance}+ tokens stream for free</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>
                        Others pay {pricePerChunk} USDC per {unlockType === "per_chunk" ? "30s segment" : "full unlock"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Incentivizes token ownership and community building</span>
                    </div>
                  </div>
                </div>
              )}
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
            {(isLoading || isCoinCreating) && <Loader2 className="h-4 w-4 mr-2 animate-spin text-accent" />}
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
