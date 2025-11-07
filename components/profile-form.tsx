"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"

interface ProfileFormProps {
  profile: Profile | null
  walletAddress: string
}

export function ProfileForm({ profile, walletAddress }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [artistName, setArtistName] = useState(profile?.artist_name || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [farcasterUrl, setFarcasterUrl] = useState((profile as any)?.farcaster_url || "")
  const [xUrl, setXUrl] = useState((profile as any)?.x_url || "")
  const [zoraUrl, setZoraUrl] = useState((profile as any)?.zora_url || "")
  const [tiktokUrl, setTiktokUrl] = useState((profile as any)?.tiktok_url || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const supabase = createClient()

      let finalAvatarUrl = avatarUrl

      if (avatarFile) {
        console.log("[v0] Starting avatar upload:", avatarFile.name, avatarFile.size)

        // Generate unique filename
        const timestamp = Date.now()
        const filename = `${timestamp}-${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filePath = `avatars/${filename}`

        const signedUrlResponse = await fetch("/api/storage/signed-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: "audio",
            filePath,
            contentType: avatarFile.type,
          }),
        })

        const contentType = signedUrlResponse.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const textError = await signedUrlResponse.text()
          console.error("[v0] Non-JSON response from signed URL API:", textError)
          throw new Error(`Server error: ${textError.substring(0, 100)}`)
        }

        const signedUrlData = await signedUrlResponse.json()

        if (!signedUrlResponse.ok) {
          throw new Error(signedUrlData.error || "Failed to get upload URL")
        }

        const { signedUrl, path } = signedUrlData

        console.log("[v0] Got signed URL, uploading file...")

        // Upload file using signed URL
        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: avatarFile,
          headers: {
            "Content-Type": avatarFile.type,
          },
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.text()
          console.error("[v0] Upload failed:", uploadError)
          throw new Error("Failed to upload avatar")
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("audio").getPublicUrl(path)

        finalAvatarUrl = publicUrl
        console.log("[v0] Avatar uploaded successfully:", publicUrl)
      }

      // Upsert profile
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          wallet_address: walletAddress.toLowerCase(), // Normalize wallet address to lowercase
          artist_name: artistName || null,
          bio: bio || null,
          avatar_url: finalAvatarUrl || null,
          farcaster_url: farcasterUrl || null,
          x_url: xUrl || null,
          zora_url: zoraUrl || null,
          tiktok_url: tiktokUrl || null,
        },
        {
          onConflict: "wallet_address",
        },
      )

      if (upsertError) throw upsertError

      setSuccess(true)
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("[v0] Profile update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar */}
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">Profile Picture</h2>

        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-primary/30">
            <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {artistName?.[0]?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Label htmlFor="avatar" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Upload className="h-4 w-4" />
                <span>Upload new avatar</span>
              </div>
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*,.gif"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {avatarFile && <p className="text-sm text-muted-foreground mt-2">{avatarFile.name}</p>}
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input
              id="wallet"
              value={walletAddress}
              disabled
              className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-2">Your wallet address cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter your artist name"
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
            <p className="text-sm text-muted-foreground mt-2">This is how you'll appear to listeners</p>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your music..."
              rows={5}
              className="bg-card/50 backdrop-blur-xl border border-border/50 resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">{bio.length}/500 characters</p>
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">Social Links</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="farcaster">Farcaster</Label>
            <Input
              id="farcaster"
              value={farcasterUrl}
              onChange={(e) => setFarcasterUrl(e.target.value)}
              placeholder="https://warpcast.com/username"
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
          </div>

          <div>
            <Label htmlFor="x">X (Twitter)</Label>
            <Input
              id="x"
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
              placeholder="https://x.com/username"
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
          </div>

          <div>
            <Label htmlFor="zora">Zora</Label>
            <Input
              id="zora"
              value={zoraUrl}
              onChange={(e) => setZoraUrl(e.target.value)}
              placeholder="https://zora.co/username"
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
          </div>

          <div>
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@username"
              className="bg-card/50 backdrop-blur-xl border border-border/50"
            />
          </div>
        </div>
      </Card>

      {/* Blockchain Info */}
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
        <h2 className="text-xl font-semibold mb-6">Blockchain Information</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-semibold">Base (Chain ID: 8453)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Token</span>
            <span className="font-semibold">USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NFT Standard</span>
            <span className="font-semibold">ERC-1155</span>
          </div>
        </div>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-card/80 backdrop-blur-2xl border border-accent/50 p-4 rounded-lg">
          <p className="text-sm text-accent">Profile updated successfully!</p>
        </div>
      )}

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
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
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
