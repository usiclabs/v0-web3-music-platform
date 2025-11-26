"use client"

import type React from "react"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Upload, X, Music, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioUploadProps {
  onUpload: (url: string) => void
  uploadedUrl: string | null
  isUploading: boolean
  setIsUploading: (uploading: boolean) => void
}

export function AudioUpload({ onUpload, uploadedUrl, isUploading, setIsUploading }: AudioUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav", "audio/x-m4a", "audio/mp4"]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
      setError("Please upload an MP3, WAV, or M4A file")
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB")
      return
    }

    setError(null)
    setIsUploading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/suno/upload-audio", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Upload failed")
      }

      const { uploadUrl } = await response.json()
      onUpload(uploadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload audio")
      setFileName(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    onUpload("")
    setFileName(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploadedUrl && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer",
          dragOver && "border-accent bg-accent/10 scale-[1.02]",
          uploadedUrl
            ? "border-green-500/50 bg-green-500/5"
            : "border-border/50 hover:border-accent/50 hover:bg-card/50",
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent rounded-2xl pointer-events-none" />

        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          className="hidden"
        />

        <div className="relative flex flex-col items-center text-center">
          {isUploading ? (
            <>
              <div className="p-4 rounded-full bg-accent/20 mb-4">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
              </div>
              <p className="font-semibold">Uploading...</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </>
          ) : uploadedUrl ? (
            <>
              <div className="p-4 rounded-full bg-green-500/20 mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="font-semibold text-green-500">Audio Uploaded</p>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{fileName}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="mt-3 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "p-4 rounded-full mb-4 transition-colors duration-300",
                  dragOver ? "bg-accent/20" : "bg-card/50",
                )}
              >
                <Upload
                  className={cn(
                    "h-8 w-8 transition-all duration-300",
                    dragOver ? "text-accent scale-110" : "text-muted-foreground",
                  )}
                />
              </div>
              <p className="font-semibold">Drop audio file here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Music className="h-3 w-3" />
                <span>MP3, WAV, M4A • Max 50MB • Up to 8 minutes</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  )
}
