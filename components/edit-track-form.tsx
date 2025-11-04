"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Plus, X, Loader2, Save, EyeOff, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/web3/wallet-context"
import Image from "next/image"

interface RoyaltySplit {
  address?: string
  recipient_address?: string
  percentage?: number
  share_percentage?: number
}

interface EditTrackFormProps {
  trackId: string
}

export function EditTrackForm({ trackId }: EditTrackFormProps) {
  const router = useRouter()
  const { address } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateProgress, setUpdateProgress] = useState<string>("")
  const [contentType, setContentType] = useState<string>("audio")

  // Form state
  const [title, setTitle] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null)
  const [pricePerChunk, setPricePerChunk] = useState("0.005")
  const [royaltySplits, setRoyaltySplits] = useState<RoyaltySplit[]>([])
  const [isActive, setIsActive] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHiding, setIsHiding] = useState(false)

  // Fetch existing track data
  useEffect(() => {
    async function fetchTrack() {
      try {
        const response = await fetch(`/api/tracks/${trackId}`)
        if (!response.ok) throw new Error("Failed to fetch track")

        const track = await response.json()

        // Verify ownership
        if (track.artist_id.toLowerCase() !== address.toLowerCase()) {
          setError("You don't have permission to edit this track")
          return
        }

        setTitle(track.title)
        setContentType(track.content_type || "audio")
        setCurrentCoverUrl(track.content_type === "video" ? track.thumbnail_url : track.cover_url)
        setPricePerChunk(track.price_per_chunk?.toString() || "0.005")
        setIsActive(track.is_active ?? true)

        // Map royalty splits to form format
        const splits = track.royalty_splits?.map((split: any) => ({
          address: split.recipient_address,
          percentage: split.share_percentage,
        })) || [{ address: address || "", percentage: 100 }]

        setRoyaltySplits(splits)
      } catch (err) {
        console.error("[v0] Failed to fetch track:", err)
        setError("Failed to load track data")
      } finally {
        setIsFetching(false)
      }
    }

    if (address) {
      fetchTrack()
    }
  }, [trackId, address])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUpdateProgress("")

    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    if (totalPercentage !== 100) {
      setError("Royalty splits must total 100%")
      return
    }

    setIsLoading(true)

    try {
      let coverUrl = currentCoverUrl

      // Upload new cover if provided
      if (coverFile) {
        setUpdateProgress(contentType === "video" ? "Uploading new thumbnail..." : "Uploading new cover image...")
        const coverFormData = new FormData()
        coverFormData.append("file", coverFile)
        coverFormData.append("type", contentType === "video" ? "thumbnail" : "cover")

        const coverResponse = await fetch("/api/upload/image", {
          method: "POST",
          body: coverFormData,
        })

        if (coverResponse.ok) {
          const { url } = await coverResponse.json()
          coverUrl = url
          console.log("[v0] New image uploaded:", url)
        } else {
          const errorData = await coverResponse.json()
          console.warn("[v0] Image upload failed:", errorData)
          throw new Error(errorData.error || "Failed to upload image")
        }
      }

      setUpdateProgress("Updating track...")
      const updateData: any = {
        title,
        price_per_chunk: Number.parseFloat(pricePerChunk),
        royalty_splits: royaltySplits,
      }

      if (contentType === "video") {
        updateData.thumbnail_url = coverUrl
      } else {
        updateData.cover_url = coverUrl
      }

      console.log("[v0] Updating track with data:", updateData)

      const response = await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update track")
      }

      setUpdateProgress("Update complete!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (err) {
      console.error("[v0] Update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update track")
    } finally {
      setIsLoading(false)
      setTimeout(() => setUpdateProgress(""), 3000)
    }
  }

  const handleToggleVisibility = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    setIsHiding(true)
    setError(null)

    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update track visibility")
      }

      setIsActive(!isActive)
    } catch (err) {
      console.error("[v0] Hide/unhide error:", err)
      setError(err instanceof Error ? err.message : "Failed to update track visibility")
    } finally {
      setIsHiding(false)
    }
  }

  const handleDelete = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    if (!confirm("Are you sure you want to permanently delete this track? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete track")
      }

      router.push("/dashboard")
    } catch (err) {
      console.error("[v0] Delete error:", err)
      setError(err instanceof Error ? err.message : "Failed to delete track")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isFetching) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-12 text-center">
        <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
        <p className="text-muted-foreground">Loading track data...</p>
      </Card>
    )
  }

  if (error && isFetching) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-12 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">Track Details</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Track Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
              required
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
          </div>

          <div>
            <Label htmlFor="cover">{contentType === "video" ? "Video Thumbnail (GIF supported)" : "Cover Image"}</Label>
            {currentCoverUrl && !coverFile && (
              <div className="mb-4 relative w-32 h-32 rounded-lg overflow-hidden">
                {currentCoverUrl.toLowerCase().endsWith(".gif") ? (
                  <img
                    src={currentCoverUrl || "/placeholder.svg"}
                    alt="Current thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={currentCoverUrl || "/placeholder.svg"}
                    alt="Current cover"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            )}
            <Input
              id="cover"
              type="file"
              accept="image/*,.gif"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
            {coverFile && (
              <p className="text-sm text-muted-foreground mt-2">
                New: {coverFile.name} ({(coverFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {!coverFile && currentCoverUrl && (
              <p className="text-sm text-muted-foreground mt-2">
                Upload a new image to replace the current {contentType === "video" ? "thumbnail" : "cover"}
              </p>
            )}
            {contentType === "video" && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Animated GIFs work great as video thumbnails! Max 15MB.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="price">Price per 30s Segment (USDC)</Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min="0"
              value={pricePerChunk}
              onChange={(e) => setPricePerChunk(e.target.value)}
              placeholder="0.005"
              required
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
            <p className="text-sm text-muted-foreground mt-2">Recommended: 0.005 USDC (0.5¢ per play)</p>
          </div>

          <div className="bg-muted/20 border border-border/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Audio files cannot be changed after upload to maintain payment integrity and
              streaming history.
            </p>
          </div>
        </div>
      </Card>

      {/* Royalty Splits */}
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
                  value={split.address || split.recipient_address || ""}
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
                  value={split.percentage || split.share_percentage || 0}
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

      {/* Visibility Status Banner */}
      {!isActive && (
        <div className="bg-muted/20 border border-border/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hidden:</strong> This track is currently hidden from public view. Only you can see it in your
            dashboard.
          </p>
        </div>
      )}

      {/* Update Progress */}
      {updateProgress && (
        <div className="bg-card/80 backdrop-blur-2xl border border-accent/50 p-4 rounded-lg">
          <p className="text-sm text-accent">{updateProgress}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-card/80 backdrop-blur-2xl border border-destructive/50 p-4 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleToggleVisibility}
          disabled={isHiding || isDeleting}
          className="bg-transparent"
        >
          {isHiding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isActive ? "Hiding..." : "Unhiding..."}
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              {isActive ? "Hide Track" : "Unhide Track"}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting || isHiding}
          className="bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/50"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Track
            </>
          )}
        </Button>
        <Button type="submit" disabled={isLoading || isDeleting || isHiding} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
