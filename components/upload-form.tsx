"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Upload, Loader2, Music, Video, Coins, Lock, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"
import { ensureProfile } from "@/lib/supabase/helpers"
import confetti from "canvas-confetti"
import { useSendTransaction, useWaitForTransactionReceipt, usePublicClient, useReadContract, useChainId } from "wagmi"
import type { Address } from "viem"
import { formatUnits } from "viem"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"

interface RoyaltySplit {
  address: string
  percentage: number
}

interface ClankerRewardRecipient {
  address: string
  admin: string
  percentage: number
  token: "Paired" | "Clanker" | "Both"
}

export function UploadForm() {
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
  const [deploymentMethod, setDeploymentMethod] = useState<"zora" | "clanker">("zora")
  const [clankerVersion, setClankerVersion] = useState<"v3.1" | "v4.0">("v4.0")
  const [coinName, setCoinName] = useState("")
  const [coinSymbol, setCoinSymbol] = useState("")
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null)
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | null>(null)
  const [coinCreationStarted, setCoinCreationStarted] = useState(false)

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Metadata
  const [tokenDescription, setTokenDescription] = useState("")
  const [socialUrls, setSocialUrls] = useState<string[]>([""])
  const [auditUrls, setAuditUrls] = useState<string[]>([])

  // v3.1 specific
  const [enableVesting, setEnableVesting] = useState(false)
  const [vestingPercentage, setVestingPercentage] = useState(20)
  const [vestingDays, setVestingDays] = useState(90)
  const [initialMarketCap, setInitialMarketCap] = useState(1)
  const [enableDevBuy, setEnableDevBuy] = useState(false)
  const [devBuyAmount, setDevBuyAmount] = useState("0.1")
  const [devBuySlippage, setDevBuySlippage] = useState(5)
  const [enableCustomRewards, setEnableCustomRewards] = useState(false)
  const [creatorRewardPercentage, setCreatorRewardPercentage] = useState(80)
  const [creatorAdmin, setCreatorAdmin] = useState("")
  const [creatorRewardRecipient, setCreatorRewardRecipient] = useState("")

  // v4.0 specific
  const [tokenAdmin, setTokenAdmin] = useState("")
  const [poolPosition, setPoolPosition] = useState<"standard" | "project">("standard")
  const [feeConfig, setFeeConfig] = useState<"static" | "dynamic">("dynamic")
  const [clankerFee, setClankerFee] = useState(100) // 1% in bps
  const [pairedFee, setPairedFee] = useState(100) // 1% in bps
  const [rewardRecipients, setRewardRecipients] = useState<ClankerRewardRecipient[]>([])
  const [v4VestingPercentage, setV4VestingPercentage] = useState(0)

  const { sendTransaction, data: txHash, reset: resetTx } = useSendTransaction()
  const {
    isLoading: isCoinCreating,
    isSuccess: isCoinCreated,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const { data: usiBalance } = useReadContract({
    address: chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!chainId,
    },
  })

  const REQUIRED_USI_BALANCE = BigInt("0")
  const hasRequiredUSI =
    REQUIRED_USI_BALANCE === BigInt("0") || (usiBalance ? (usiBalance as bigint) >= REQUIRED_USI_BALANCE : false)
  const usiBalanceFormatted = usiBalance ? formatUnits(usiBalance as bigint, 18) : "0"

  useEffect(() => {
    if (address && !tokenAdmin && clankerVersion === "v4.0") {
      setTokenAdmin(address)
    }
  }, [address, clankerVersion, tokenAdmin])

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
    if (tokenizeTrack && !tokenDescription) {
      setTokenDescription(`Token for ${contentType}: ${newTitle}`)
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

  const addSocialUrl = () => {
    setSocialUrls([...socialUrls, ""])
  }

  const removeSocialUrl = (index: number) => {
    setSocialUrls(socialUrls.filter((_, i) => i !== index))
  }

  const updateSocialUrl = (index: number, value: string) => {
    const updated = [...socialUrls]
    updated[index] = value
    setSocialUrls(updated)
  }

  const addAuditUrl = () => {
    setAuditUrls([...auditUrls, ""])
  }

  const removeAuditUrl = (index: number) => {
    setAuditUrls(auditUrls.filter((_, i) => i !== index))
  }

  const updateAuditUrl = (index: number, value: string) => {
    const updated = [...auditUrls]
    updated[index] = value
    setAuditUrls(updated)
  }

  const addRewardRecipient = () => {
    setRewardRecipients([...rewardRecipients, { address: "", admin: address || "", percentage: 0, token: "Both" }])
  }

  const removeRewardRecipient = (index: number) => {
    setRewardRecipients(rewardRecipients.filter((_, i) => i !== index))
  }

  const updateRewardRecipient = (
    index: number,
    field: "address" | "admin" | "percentage" | "token",
    value: string | number,
  ) => {
    const updated = [...rewardRecipients]
    updated[index] = { ...updated[index], [field]: value }
    setRewardRecipients(updated)
  }

  const createClankerToken = async (trackId: string, coverImageUrl: string | null) => {
    if (!address || !tokenizeTrack) return

    try {
      setUploadProgress("Deploying token via Clanker...")
      setCoinCreationStarted(true)
      console.log("[v0] Creating Clanker token for track:", trackId)

      const advancedConfig: any = {
        metadata: {
          description: tokenDescription || `Token for ${contentType}: ${title}`,
          socialMediaUrls: socialUrls.filter((url) => url.trim() !== ""),
          auditUrls: auditUrls.filter((url) => url.trim() !== ""),
        },
        context: {
          interface: "MyUSIC",
          platform: "https://myusic.xyz",
          messageId: trackId,
          id: trackId,
        },
      }

      if (clankerVersion === "v3.1") {
        // v3.1 specific config
        if (enableVesting) {
          advancedConfig.vault = {
            percentage: vestingPercentage,
            durationInDays: vestingDays,
          }
        }
        advancedConfig.pool = {
          quoteToken: "0x4200000000000000000000000000000000000006", // WETH on Base
          initialMarketCap: initialMarketCap.toString(),
        }
        if (enableDevBuy) {
          advancedConfig.devBuy = {
            ethAmount: devBuyAmount,
            maxSlippage: devBuySlippage,
          }
        }
        if (enableCustomRewards) {
          advancedConfig.rewardsConfig = {
            creatorReward: creatorRewardPercentage,
            ...(creatorAdmin && { creatorAdmin }),
            ...(creatorRewardRecipient && { creatorRewardRecipient }),
          }
        }
      } else {
        // v4.0 specific config
        advancedConfig.tokenAdmin = tokenAdmin || address
        advancedConfig.poolPosition = poolPosition
        advancedConfig.feeConfig = feeConfig
        if (feeConfig === "static") {
          advancedConfig.clankerFee = clankerFee
          advancedConfig.pairedFee = pairedFee
        }
        if (rewardRecipients.length > 0) {
          advancedConfig.rewards = rewardRecipients.map((r) => ({
            recipient: r.address,
            admin: r.admin,
            bps: r.percentage * 100, // Convert percentage to basis points
            token: r.token,
          }))
        }
        if (v4VestingPercentage > 0) {
          advancedConfig.vault = {
            percentage: v4VestingPercentage,
          }
        }
      }

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
          version: clankerVersion,
          advancedConfig,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to deploy token via Clanker")
      }

      const { tokenAddress } = await response.json()
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
        resetTx()
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error("[v0] Failed to create Clanker token:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`✅ Track uploaded successfully! However, token deployment failed: ${errorMessage}`)
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
      })
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
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/dashboard")
      }, 3000)
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

    const maxSize = 50 * 1024 * 1024
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
      if (clankerVersion === "v4.0" && !tokenAdmin) {
        setError("Please provide token admin address for Clanker v4.0")
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
          if (deploymentMethod === "clanker") {
            await createClankerToken(track.id, uploadedCoverUrl)
          } else {
            await createZoraCoin(track.id, uploadedCoverUrl)
          }
          return
        } catch (coinError) {
          console.error("[v0] Token creation failed, but track uploaded:", coinError)
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
              <p className="text-sm text-muted-foreground mt-1">Create a tradeable token for your {contentType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasRequiredUSI && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Requires 1M $USI</span>
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
                  <span className="font-semibold text-accent">1,000,000 $USI</span> tokens to access.
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
                <div className="grid grid-cols-2 gap-4">
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
                      <div className="text-xs text-muted-foreground">Deploy ERC20 with auto Uniswap pool</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {deploymentMethod === "clanker" && (
              <div>
                <Label className="mb-3 block">Clanker Version</Label>
                <RadioGroup
                  value={clankerVersion}
                  onValueChange={(value) => setClankerVersion(value as "v3.1" | "v4.0")}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        clankerVersion === "v4.0"
                          ? "border-accent bg-accent/10"
                          : "border-border/50 bg-card/30 hover:border-border"
                      }`}
                    >
                      <RadioGroupItem value="v4.0" id="v4.0" className="mt-1" />
                      <Label htmlFor="v4.0" className="flex-1 cursor-pointer">
                        <div className="font-semibold mb-1">Clanker 4.0</div>
                        <div className="text-xs text-muted-foreground">Uniswap v4 pool (Latest)</div>
                      </Label>
                    </div>
                    <div
                      className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        clankerVersion === "v3.1"
                          ? "border-accent bg-accent/10"
                          : "border-border/50 bg-card/30 hover:border-border"
                      }`}
                    >
                      <RadioGroupItem value="v3.1" id="v3.1" className="mt-1" />
                      <Label htmlFor="v3.1" className="flex-1 cursor-pointer">
                        <div className="font-semibold mb-1">Clanker 3.1</div>
                        <div className="text-xs text-muted-foreground">Uniswap v3 pool (Legacy)</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {deploymentMethod === "clanker" && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  {clankerVersion === "v4.0"
                    ? "Clanker 4.0 deploys a standard ERC20 token with automatic Uniswap v4 liquidity pool creation, making your token instantly tradeable with fair price distribution."
                    : "Clanker 3.1 deploys a standard ERC20 token with automatic Uniswap v3 liquidity pool creation, with support for vesting schedules and custom reward distribution."}
                </p>
              </div>
            )}

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

            {deploymentMethod === "clanker" && (
              <div className="border-t border-border/50 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-sm">Advanced Token Configuration</span>
                  {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAdvancedOptions && (
                  <div className="mt-4 space-y-6">
                    {/* Token Metadata */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Token Metadata</h3>

                      <div>
                        <Label htmlFor="tokenDescription">Description</Label>
                        <Textarea
                          id="tokenDescription"
                          value={tokenDescription}
                          onChange={(e) => setTokenDescription(e.target.value)}
                          placeholder="Describe your token and what it represents..."
                          className="bg-card/50 backdrop-blur-xl border border-border/50 min-h-[80px]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Social Media URLs</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addSocialUrl}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add URL
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {socialUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={url}
                                onChange={(e) => updateSocialUrl(index, e.target.value)}
                                placeholder="https://twitter.com/yourtoken"
                                className="bg-card/50 backdrop-blur-xl border border-border/50 text-sm"
                              />
                              {socialUrls.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSocialUrl(index)}
                                  className="h-10 w-10 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Audit URLs (Optional)</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={addAuditUrl} className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Add URL
                          </Button>
                        </div>
                        {auditUrls.length > 0 && (
                          <div className="space-y-2">
                            {auditUrls.map((url, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={url}
                                  onChange={(e) => updateAuditUrl(index, e.target.value)}
                                  placeholder="https://audit.example.com/report"
                                  className="bg-card/50 backdrop-blur-xl border border-border/50 text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAuditUrl(index)}
                                  className="h-10 w-10 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* v3.1 Specific Options */}
                    {clankerVersion === "v3.1" && (
                      <>
                        {/* Initial Market Cap */}
                        <div className="space-y-3">
                          <Label>Initial Market Cap (ETH)</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[initialMarketCap]}
                              onValueChange={(value) => setInitialMarketCap(value[0])}
                              min={0.1}
                              max={10}
                              step={0.1}
                              className="flex-1"
                            />
                            <span className="font-mono text-sm font-semibold w-16 text-right">
                              {initialMarketCap.toFixed(1)} ETH
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Starting liquidity for your token's Uniswap pool
                          </p>
                        </div>

                        {/* Vesting Vault */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Vesting Vault</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Lock a percentage of tokens with a vesting schedule
                              </p>
                            </div>
                            <Switch checked={enableVesting} onCheckedChange={setEnableVesting} />
                          </div>

                          {enableVesting && (
                            <div className="space-y-4 pl-4 border-l-2 border-accent/20">
                              <div>
                                <Label>Vesting Percentage</Label>
                                <div className="flex items-center gap-4 mt-2">
                                  <Slider
                                    value={[vestingPercentage]}
                                    onValueChange={(value) => setVestingPercentage(value[0])}
                                    min={1}
                                    max={50}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <span className="font-mono text-sm font-semibold w-12 text-right">
                                    {vestingPercentage}%
                                  </span>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="vestingDays">Vesting Duration (Days)</Label>
                                <Input
                                  id="vestingDays"
                                  type="number"
                                  min="1"
                                  max="365"
                                  value={vestingDays}
                                  onChange={(e) => setVestingDays(Number.parseInt(e.target.value) || 90)}
                                  className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Common: 30, 90, 180, or 365 days</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Dev Buy */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Initial Dev Buy</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Automatically buy tokens at launch to provide initial liquidity
                              </p>
                            </div>
                            <Switch checked={enableDevBuy} onCheckedChange={setEnableDevBuy} />
                          </div>

                          {enableDevBuy && (
                            <div className="space-y-4 pl-4 border-l-2 border-accent/20">
                              <div>
                                <Label htmlFor="devBuyAmount">ETH Amount</Label>
                                <Input
                                  id="devBuyAmount"
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max="10"
                                  value={devBuyAmount}
                                  onChange={(e) => setDevBuyAmount(e.target.value)}
                                  className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Amount of ETH to spend buying your token
                                </p>
                              </div>

                              <div>
                                <Label>Max Slippage</Label>
                                <div className="flex items-center gap-4 mt-2">
                                  <Slider
                                    value={[devBuySlippage]}
                                    onValueChange={(value) => setDevBuySlippage(value[0])}
                                    min={1}
                                    max={20}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <span className="font-mono text-sm font-semibold w-12 text-right">
                                    {devBuySlippage}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Maximum price slippage tolerance</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Custom Rewards */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Custom Reward Distribution</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Configure creator rewards (Clanker retains 20%)
                              </p>
                            </div>
                            <Switch checked={enableCustomRewards} onCheckedChange={setEnableCustomRewards} />
                          </div>

                          {enableCustomRewards && (
                            <div className="space-y-4 pl-4 border-l-2 border-accent/20">
                              <div>
                                <Label>Creator Reward Percentage</Label>
                                <div className="flex items-center gap-4 mt-2">
                                  <Slider
                                    value={[creatorRewardPercentage]}
                                    onValueChange={(value) => setCreatorRewardPercentage(value[0])}
                                    min={0}
                                    max={80}
                                    step={5}
                                    className="flex-1"
                                  />
                                  <span className="font-mono text-sm font-semibold w-12 text-right">
                                    {creatorRewardPercentage}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Your share: {creatorRewardPercentage}% | Interface: {80 - creatorRewardPercentage}% |
                                  Clanker: 20%
                                </p>
                              </div>

                              <div>
                                <Label htmlFor="creatorAdmin">Creator Admin Address (Optional)</Label>
                                <Input
                                  id="creatorAdmin"
                                  value={creatorAdmin}
                                  onChange={(e) => setCreatorAdmin(e.target.value)}
                                  placeholder={address || "0x..."}
                                  className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
                                />
                              </div>

                              <div>
                                <Label htmlFor="creatorRewardRecipient">Reward Recipient Address (Optional)</Label>
                                <Input
                                  id="creatorRewardRecipient"
                                  value={creatorRewardRecipient}
                                  onChange={(e) => setCreatorRewardRecipient(e.target.value)}
                                  placeholder={address || "0x..."}
                                  className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* v4.0 Specific Options */}
                    {clankerVersion === "v4.0" && (
                      <>
                        {/* Token Admin */}
                        <div>
                          <Label htmlFor="tokenAdmin">Token Admin Address</Label>
                          <Input
                            id="tokenAdmin"
                            value={tokenAdmin}
                            onChange={(e) => setTokenAdmin(e.target.value)}
                            placeholder={address || "0x..."}
                            required
                            className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Address with admin privileges for the token
                          </p>
                        </div>

                        {/* Pool Position */}
                        <div>
                          <Label className="mb-3 block">Pool Position Strategy</Label>
                          <RadioGroup
                            value={poolPosition}
                            onValueChange={(value) => setPoolPosition(value as "standard" | "project")}
                          >
                            <div className="space-y-2">
                              <div
                                className={`flex items-start space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                  poolPosition === "standard"
                                    ? "border-accent bg-accent/10"
                                    : "border-border/50 bg-card/30 hover:border-border"
                                }`}
                              >
                                <RadioGroupItem value="standard" id="standard" className="mt-1" />
                                <Label htmlFor="standard" className="flex-1 cursor-pointer">
                                  <div className="font-semibold text-sm mb-1">Standard</div>
                                  <div className="text-xs text-muted-foreground">
                                    Balanced liquidity distribution for general trading
                                  </div>
                                </Label>
                              </div>
                              <div
                                className={`flex items-start space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                  poolPosition === "project"
                                    ? "border-accent bg-accent/10"
                                    : "border-border/50 bg-card/30 hover:border-border"
                                }`}
                              >
                                <RadioGroupItem value="project" id="project" className="mt-1" />
                                <Label htmlFor="project" className="flex-1 cursor-pointer">
                                  <div className="font-semibold text-sm mb-1">Project</div>
                                  <div className="text-xs text-muted-foreground">
                                    Optimized for project tokens with concentrated liquidity
                                  </div>
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Fee Configuration */}
                        <div>
                          <Label className="mb-3 block">Fee Configuration</Label>
                          <RadioGroup
                            value={feeConfig}
                            onValueChange={(value) => setFeeConfig(value as "static" | "dynamic")}
                          >
                            <div className="space-y-2">
                              <div
                                className={`flex items-start space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                  feeConfig === "dynamic"
                                    ? "border-accent bg-accent/10"
                                    : "border-border/50 bg-card/30 hover:border-border"
                                }`}
                              >
                                <RadioGroupItem value="dynamic" id="dynamic" className="mt-1" />
                                <Label htmlFor="dynamic" className="flex-1 cursor-pointer">
                                  <div className="font-semibold text-sm mb-1">Dynamic (Recommended)</div>
                                  <div className="text-xs text-muted-foreground">
                                    Automatically adjusts fees based on market conditions
                                  </div>
                                </Label>
                              </div>
                              <div
                                className={`flex items-start space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                  feeConfig === "static"
                                    ? "border-accent bg-accent/10"
                                    : "border-border/50 bg-card/30 hover:border-border"
                                }`}
                              >
                                <RadioGroupItem value="static" id="static" className="mt-1" />
                                <Label htmlFor="static" className="flex-1 cursor-pointer">
                                  <div className="font-semibold text-sm mb-1">Static</div>
                                  <div className="text-xs text-muted-foreground">Fixed fee percentages</div>
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>

                          {feeConfig === "static" && (
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-accent/20">
                              <div>
                                <Label>Clanker Token Fee (bps)</Label>
                                <div className="flex items-center gap-4 mt-2">
                                  <Slider
                                    value={[clankerFee]}
                                    onValueChange={(value) => setClankerFee(value[0])}
                                    min={0}
                                    max={500}
                                    step={10}
                                    className="flex-1"
                                  />
                                  <span className="font-mono text-sm font-semibold w-20 text-right">
                                    {clankerFee} bps
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(clankerFee / 100).toFixed(2)}% fee on Clanker token trades
                                </p>
                              </div>

                              <div>
                                <Label>Paired Token Fee (bps)</Label>
                                <div className="flex items-center gap-4 mt-2">
                                  <Slider
                                    value={[pairedFee]}
                                    onValueChange={(value) => setPairedFee(value[0])}
                                    min={0}
                                    max={500}
                                    step={10}
                                    className="flex-1"
                                  />
                                  <span className="font-mono text-sm font-semibold w-20 text-right">
                                    {pairedFee} bps
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(pairedFee / 100).toFixed(2)}% fee on paired token (WETH) trades
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vesting */}
                        <div>
                          <Label>Vesting Percentage</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[v4VestingPercentage]}
                              onValueChange={(value) => setV4VestingPercentage(value[0])}
                              min={0}
                              max={50}
                              step={1}
                              className="flex-1"
                            />
                            <span className="font-mono text-sm font-semibold w-12 text-right">
                              {v4VestingPercentage}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Percentage of tokens to vault at launch (0 = no vesting)
                          </p>
                        </div>

                        {/* Reward Recipients */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Reward Recipients</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={addRewardRecipient}
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Recipient
                            </Button>
                          </div>

                          {rewardRecipients.length > 0 && (
                            <div className="space-y-4">
                              {rewardRecipients.map((recipient, index) => (
                                <div
                                  key={index}
                                  className="p-4 rounded-lg border border-border/50 bg-card/30 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">Recipient {index + 1}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeRewardRecipient(index)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Recipient Address</Label>
                                    <Input
                                      value={recipient.address}
                                      onChange={(e) => updateRewardRecipient(index, "address", e.target.value)}
                                      placeholder="0x..."
                                      className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs">Admin Address</Label>
                                    <Input
                                      value={recipient.admin}
                                      onChange={(e) => updateRewardRecipient(index, "admin", e.target.value)}
                                      placeholder="0x..."
                                      className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs">Reward Percentage</Label>
                                    <div className="flex items-center gap-4 mt-1">
                                      <Slider
                                        value={[recipient.percentage]}
                                        onValueChange={(value) => updateRewardRecipient(index, "percentage", value[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="flex-1"
                                      />
                                      <span className="font-mono text-sm font-semibold w-12 text-right">
                                        {recipient.percentage}%
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Token Type</Label>
                                    <RadioGroup
                                      value={recipient.token}
                                      onValueChange={(value) =>
                                        updateRewardRecipient(index, "token", value as "Paired" | "Clanker" | "Both")
                                      }
                                      className="flex gap-2 mt-1"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Paired" id={`paired-${index}`} />
                                        <Label htmlFor={`paired-${index}`} className="text-xs cursor-pointer">
                                          Paired
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Clanker" id={`clanker-${index}`} />
                                        <Label htmlFor={`clanker-${index}`} className="text-xs cursor-pointer">
                                          Clanker
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Both" id={`both-${index}`} />
                                        <Label htmlFor={`both-${index}`} className="text-xs cursor-pointer">
                                          Both
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">Base</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paired Token:</span>
                <span className="font-medium">{deploymentMethod === "zora" ? "ETH" : "WETH"}</span>
              </div>
              {deploymentMethod === "zora" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Starting Market Cap:</span>
                  <span className="font-medium">Low (Accessible)</span>
                </div>
              )}
              {deploymentMethod === "clanker" && (
                <>
                  {clankerVersion === "v3.1" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Initial Market Cap:</span>
                      <span className="font-medium">{initialMarketCap} ETH</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Liquidity Pool:</span>
                    <span className="font-medium">Uniswap {clankerVersion === "v4.0" ? "v4" : "v3"} (Auto)</span>
                  </div>
                </>
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
