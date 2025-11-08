"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAccount } from "wagmi"
import { X, Upload, ImageIcon, Video, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"

interface CreateStoryModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateStoryModal({ onClose, onSuccess }: CreateStoryModalProps) {
  const { address } = useAccount()
  const [step, setStep] = useState<"upload" | "details">("upload")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>("")
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null)
  const [caption, setCaption] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [isTokenGated, setIsTokenGated] = useState(false)
  const [requiredAmount, setRequiredAmount] = useState("")
  const [uploading, setUploading] = useState(false)
  const [profileToken, setProfileToken] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useState(() => {
    loadProfile()
  })

  async function loadProfile() {
    if (!address) return

    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("profiles")
      .select("profile_token_address")
      .eq("wallet_address", address)
      .single()

    setProfileToken(data?.profile_token_address || null)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const type = file.type.startsWith("image/") ? "photo" : file.type.startsWith("video/") ? "video" : null
    if (!type) {
      alert("Please select an image or video file")
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("File size must be less than 100MB")
      return
    }

    setMediaFile(file)
    setMediaType(type)
    setMediaPreview(URL.createObjectURL(file))
    setStep("details")
  }

  async function handleUpload() {
    if (!mediaFile || !address) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", mediaFile)

      console.log("[v0] Uploading story file:", {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type,
      })

      const uploadResponse = await fetch("/api/stories/upload", {
        method: "POST",
        body: formData,
      })

      const contentType = uploadResponse.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await uploadResponse.text()
        console.error("[v0] Non-JSON response:", text)
        throw new Error("Server returned non-JSON response. Please try a smaller file.")
      }

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Failed to upload file")
      }

      const { url: blobUrl } = await uploadResponse.json()
      console.log("[v0] Upload successful:", blobUrl)

      // Create story
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistAddress: address,
          mediaUrl: blobUrl,
          mediaType,
          thumbnailUrl: mediaType === "video" ? mediaPreview : blobUrl,
          duration: mediaType === "photo" ? 5 : 15,
          caption,
          linkUrl,
          linkText,
          isTokenGated,
          requiredTokenAddress: isTokenGated ? profileToken : null,
          requiredTokenAmount: isTokenGated ? requiredAmount : 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create story")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("[Create Story] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create story. Please try again."
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">Create Story</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={uploading}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {step === "upload" ? (
          /* Upload Step */
          <div className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1">Upload Photo or Video</p>
                <p className="text-sm text-muted-foreground">Click to select a file (max 100MB)</p>
              </div>
              <div className="flex gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">Photo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  <span className="text-sm">Video</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Details Step */
          <div className="p-6 space-y-6">
            {/* Preview */}
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black">
              {mediaType === "video" ? (
                <video src={mediaPreview} className="w-full h-full object-cover" controls />
              ) : (
                <img src={mediaPreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 backdrop-blur-xl hover:bg-black/70"
                onClick={() => {
                  setStep("upload")
                  setMediaFile(null)
                  setMediaPreview("")
                }}
              >
                Change
              </Button>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Textarea
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{caption.length}/200</p>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label>Add Link (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  type="url"
                />
              </div>
              {linkUrl && (
                <Input
                  placeholder="Link text (e.g., 'Buy Now')"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  maxLength={20}
                />
              )}
            </div>

            {/* Token Gate */}
            {profileToken && (
              <div className="space-y-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-500" />
                    <Label htmlFor="token-gate">Token Gate This Story</Label>
                  </div>
                  <Switch id="token-gate" checked={isTokenGated} onCheckedChange={setIsTokenGated} />
                </div>
                {isTokenGated && (
                  <div className="space-y-2">
                    <Label>Required Token Amount</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      value={requiredAmount}
                      onChange={(e) => setRequiredAmount(e.target.value)}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only fans holding this amount of your profile tokens can view this story
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Share Button */}
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleUpload}
              disabled={uploading || !mediaFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Story...
                </>
              ) : (
                "Share to Story"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
