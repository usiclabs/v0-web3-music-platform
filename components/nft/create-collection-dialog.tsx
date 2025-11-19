"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { Plus, Loader2, ImageIcon } from 'lucide-react'

interface CreateCollectionDialogProps {
  onCollectionCreated?: () => void
}

export function CreateCollectionDialog({ onCollectionCreated }: CreateCollectionDialogProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  const supabase = createBrowserClient()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string>("")
  
  const [formData, setFormData] = useState({
    collectionName: "",
    collectionSymbol: "", // Added symbol field for contract
    description: "",
    bannerImage: null as File | null,
    royaltyPercentage: 10,
  })

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setFormData({ ...formData, bannerImage: file })
  }

  async function uploadToBlob(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/nft/upload-banner", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Upload failed")
    }

    const data = await response.json()
    return data.url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("wallet_address", address)
        .maybeSingle()

      if (!existingProfile && !profileCheckError) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            wallet_address: address,
            artist_name: `Artist ${address.slice(0, 6)}`,
            bio: "",
            verified: false,
          })

        if (profileError) {
          if (!profileError.message.includes("duplicate key")) {
            throw new Error(`Failed to create profile: ${profileError.message}`)
          }
        }
      }

      let bannerImageUrl = ""
      if (formData.bannerImage) {
        bannerImageUrl = await uploadToBlob(formData.bannerImage)
      }

      const { data, error } = await supabase
        .from("nft_collections")
        .insert({
          collection_name: formData.collectionName,
          collection_symbol: formData.collectionSymbol || formData.collectionName.toUpperCase().replace(/\s+/g, '').slice(0, 5),
          description: formData.description,
          artist_address: address,
          contract_address: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
          banner_image_url: bannerImageUrl,
          royalty_percentage: formData.royaltyPercentage,
          total_supply: 0,
          minted_count: 0,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Collection created!",
        description: `${formData.collectionName} is ready for minting`,
      })

      setFormData({
        collectionName: "",
        collectionSymbol: "", // Reset symbol field
        description: "",
        bannerImage: null,
        royaltyPercentage: 10,
      })
      setBannerPreview("")
      setOpen(false)
      
      if (onCollectionCreated) {
        onCollectionCreated()
      }
    } catch (error) {
      console.error("Collection creation error:", error)
      toast({
        title: "Failed to create collection",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create NFT Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your music NFTs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Collection Name *</Label>
            <Input
              value={formData.collectionName}
              onChange={(e) =>
                setFormData({ ...formData, collectionName: e.target.value })
              }
              placeholder="Summer Vibes Collection"
              required
            />
          </div>

          <div>
            <Label>Collection Symbol</Label>
            <Input
              value={formData.collectionSymbol}
              onChange={(e) =>
                setFormData({ ...formData, collectionSymbol: e.target.value.toUpperCase() })
              }
              placeholder="SUMMER"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Short symbol for your collection (e.g., BEATS, VIBES)
            </p>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your collection..."
              rows={3}
            />
          </div>

          <div>
            <Label>Banner Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cursor-pointer">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload banner image
                </p>
                {bannerPreview && (
                  <img
                    src={bannerPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="mt-4 mx-auto h-32 w-full object-cover rounded-lg"
                  />
                )}
              </label>
            </div>
          </div>

          <div>
            <Label>Default Royalty Percentage</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={formData.royaltyPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  royaltyPercentage: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default royalty for NFTs in this collection (0-50%)
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Collection"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
