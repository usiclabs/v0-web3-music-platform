"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, ImageIcon } from 'lucide-react'
import { put } from "@vercel/blob"

interface ThumbnailUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trackId: string
  trackTitle: string
  currentThumbnail?: string
  currentCover?: string
  isVideo?: boolean
  onSuccess?: () => void
}

export default function ThumbnailUploadDialog({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  currentThumbnail,
  currentCover,
  isVideo = false,
  onSuccess,
}: ThumbnailUploadDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!imageFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Upload to Vercel Blob
      const blob = await put(imageFile.name, imageFile, {
        access: "public",
      })

      console.log("[v0] Image uploaded to blob:", blob.url)

      // Update track with new thumbnail/cover URL
      const updateData = isVideo 
        ? { thumbnail_url: blob.url }
        : { cover_url: blob.url, thumbnail_url: blob.url }

      const response = await fetch(`/api/admin/tracks/${trackId}/thumbnail`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": window.ethereum?.selectedAddress || "",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update thumbnail")
      }

      toast({
        title: "Success!",
        description: isVideo 
          ? "Video thumbnail updated successfully"
          : "Track cover image updated successfully",
      })

      onSuccess?.()
      onOpenChange(false)
      
      // Reset state
      setImageFile(null)
      setPreviewUrl("")
    } catch (error) {
      console.error("[v0] Error uploading thumbnail:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isVideo ? "Update Video Thumbnail" : "Update Cover Image"}
          </DialogTitle>
          <DialogDescription>
            Upload a new {isVideo ? "thumbnail" : "cover image"} for "{trackTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current image preview */}
          {(currentThumbnail || currentCover) && !previewUrl && (
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="relative aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-border">
                <img
                  src={isVideo ? currentThumbnail : currentCover}
                  alt="Current"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* New image preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>New Image Preview</Label>
              <div className="relative aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-primary">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Select Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={uploading}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, at least 1000x1000px, max 5MB
            </p>
          </div>

          {/* Upload button */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!imageFile || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
