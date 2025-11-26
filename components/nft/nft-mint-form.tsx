"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { VinylRecord3D } from "./vinyl-record-3d"
import { Loader2, Sparkles, Music, ImageIcon } from "lucide-react"
import { uploadToBlob } from "@/app/actions/upload-blob"
import { CreateCollectionDialog } from "./create-collection-dialog"

export function NFTMintForm() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tracks, setTracks] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [coverPreview, setCoverPreview] = useState<string>("")

  const [formData, setFormData] = useState({
    collectionId: "",
    trackId: "",
    name: "",
    description: "",
    coverImage: null as File | null,
    totalEditions: 1,
    mintPrice: "",
    royaltyPercentage: 10,
    rarityTier: "common" as "common" | "uncommon" | "rare" | "epic" | "legendary",
    attributes: [] as { trait_type: string; value: string }[],
  })

  // Fetch user's tracks
  useEffect(() => {
    if (address) {
      fetchTracks()
      fetchCollections()
    }
  }, [address])

  async function fetchTracks() {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("artist_id", address)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTracks(data)
    }
  }

  async function fetchCollections() {
    const { data, error } = await supabase
      .from("nft_collections")
      .select("*")
      .eq("artist_address", address)
      .eq("is_active", true)

    if (!error && data) {
      setCollections(data)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setFormData({ ...formData, coverImage: file })
  }

  async function uploadFile(file: File): Promise<string> {
    // Convert file to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const dataUrl = reader.result as string
        const result = await uploadToBlob(file.name, dataUrl, file.type)

        if (result.error) {
          reject(new Error(result.error))
        } else if (result.url) {
          resolve(result.url)
        } else {
          reject(new Error("Upload failed"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint NFTs",
        variant: "destructive",
      })
      return
    }

    if (!formData.collectionId) {
      toast({
        title: "Select a collection",
        description: "Please select or create a collection first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Upload cover image
      let coverImageUrl = ""
      if (formData.coverImage) {
        setUploading(true)
        coverImageUrl = await uploadFile(formData.coverImage)
        setUploading(false)
      }

      // Get selected track for metadata
      const track = tracks.find((t) => t.id === formData.trackId)

      // Create NFT metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: coverImageUrl,
        animation_url: track?.audio_url,
        external_url: `${window.location.origin}/nft-marketplace/nft/${formData.collectionId}`,
        attributes: [
          ...formData.attributes,
          { trait_type: "Rarity", value: formData.rarityTier },
          { trait_type: "Edition Size", value: formData.totalEditions.toString() },
        ],
        properties: {
          artist: address,
          track_title: track?.title || "",
          duration: track?.duration || 0,
          release_date: new Date().toISOString(),
        },
      }

      // Upload metadata to blob storage
      const metadataJson = JSON.stringify(metadata, null, 2)
      const metadataDataUrl = `data:application/json;base64,${Buffer.from(metadataJson).toString("base64")}`
      const tokenUri = await uploadToBlob("metadata.json", metadataDataUrl, "application/json").then((result) => {
        if (result.error) throw new Error(result.error)
        return result.url!
      })

      // Mint NFTs in database (minting will happen via smart contract separately)
      const nftPromises = []
      for (let i = 1; i <= formData.totalEditions; i++) {
        nftPromises.push(
          supabase.from("music_nfts").insert({
            collection_id: formData.collectionId,
            track_id: formData.trackId || null,
            token_id: `${Date.now()}-${i}`,
            token_uri: tokenUri,
            creator_address: address,
            edition_number: i,
            total_editions: formData.totalEditions,
            mint_price: Number.parseFloat(formData.mintPrice),
            current_price: Number.parseFloat(formData.mintPrice),
            rarity_tier: formData.rarityTier,
            metadata,
            is_listed: true,
          }),
        )
      }

      await Promise.all(nftPromises)

      // Update collection minted count
      await supabase.rpc("increment_collection_minted", {
        collection_id: formData.collectionId,
        increment_by: formData.totalEditions,
      })

      toast({
        title: "NFTs minted successfully!",
        description: `${formData.totalEditions} edition(s) created and listed on the marketplace`,
      })

      // Reset form
      setFormData({
        collectionId: "",
        trackId: "",
        name: "",
        description: "",
        coverImage: null,
        totalEditions: 1,
        mintPrice: "",
        royaltyPercentage: 10,
        rarityTier: "common",
        attributes: [],
      })
      setCoverPreview("")
    } catch (error) {
      console.error("Mint error:", error)
      toast({
        title: "Minting failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Please connect your wallet to mint NFTs</p>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Form */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Music className="h-5 w-5" />
              NFT Details
            </h2>

            {/* Collection Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Collection *</Label>
                <CreateCollectionDialog onCollectionCreated={fetchCollections} />
              </div>
              <Select
                value={formData.collectionId}
                onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No collections yet. Create one to get started!
                    </div>
                  ) : (
                    collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.collection_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Track Selection */}
            <div>
              <Label>Link to Track (Optional)</Label>
              <Select value={formData.trackId} onValueChange={(value) => setFormData({ ...formData, trackId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* NFT Name */}
            <div>
              <Label>NFT Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Summer Vibes Limited Edition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your music NFT..."
                rows={4}
              />
            </div>

            {/* Cover Image */}
            <div>
              <Label>Cover Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" id="cover-upload" />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload cover image</p>
                  {coverPreview && (
                    <img
                      src={coverPreview || "/placeholder.svg"}
                      alt="Preview"
                      className="mt-4 mx-auto h-32 w-32 object-cover rounded-lg"
                    />
                  )}
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Minting Configuration
            </h2>

            {/* Edition Size */}
            <div>
              <Label>Edition Size *</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={formData.totalEditions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalEditions: Number.parseInt(e.target.value) || 1,
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Number of identical NFTs to mint</p>
            </div>

            {/* Mint Price */}
            <div>
              <Label>Mint Price (USDC) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.mintPrice}
                onChange={(e) => setFormData({ ...formData, mintPrice: e.target.value })}
                placeholder="10.00"
                required
              />
            </div>

            {/* Rarity */}
            <div>
              <Label>Rarity Tier</Label>
              <Select
                value={formData.rarityTier}
                onValueChange={(value: any) => setFormData({ ...formData, rarityTier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Royalty Percentage */}
            <div>
              <Label>Royalty Percentage</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.royaltyPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    royaltyPercentage: Number.parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">Royalty on secondary sales (0-50%)</p>
            </div>
          </Card>
        </div>

        {/* Right column - Preview */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="aspect-square bg-gradient-to-br from-black to-zinc-900 rounded-lg overflow-hidden">
              <VinylRecord3D coverImage={coverPreview} rarity={formData.rarityTier} className="w-full h-full" />
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-lg">{formData.name || "Untitled NFT"}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {formData.description || "No description provided"}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Edition Size</p>
                  <p className="font-semibold">{formData.totalEditions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-semibold">{formData.mintPrice || "0"} USDC</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? "Uploading..." : "Minting..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Mint {formData.totalEditions} NFT{formData.totalEditions > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
