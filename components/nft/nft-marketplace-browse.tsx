"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { VinylRecordCard } from "./vinyl-record-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, SlidersHorizontal, TrendingUp, Flame, Clock, Grid3x3, List, Sparkles } from 'lucide-react'
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import type { MusicNFT, NFTCollection } from "@/types/nft"
import { NFTPurchaseModal } from "./nft-purchase-modal"

type SortOption = "recent" | "price_low" | "price_high" | "rarity" | "popular"
type ViewMode = "grid" | "list"

export function NFTMarketplaceBrowse() {
  const { address } = useAccount()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [nfts, setNfts] = useState<(MusicNFT & { collection?: NFTCollection })[]>([])
  const [collections, setCollections] = useState<NFTCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCollection, setSelectedCollection] = useState<string>("all")
  const [selectedRarity, setSelectedRarity] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedNft, setSelectedNft] = useState<(MusicNFT & { collection?: NFTCollection }) | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  useEffect(() => {
    fetchNFTs()
    fetchCollections()
    if (address) {
      fetchFavorites()
    }
  }, [selectedCollection, selectedRarity, sortBy])

  async function fetchNFTs() {
    setLoading(true)
    
    let query = supabase
      .from("music_nfts")
      .select(`
        *,
        collection:nft_collections(*)
      `)
      .eq("is_listed", true)

    // Filter by collection
    if (selectedCollection !== "all") {
      query = query.eq("collection_id", selectedCollection)
    }

    // Filter by rarity
    if (selectedRarity !== "all") {
      query = query.eq("rarity_tier", selectedRarity)
    }

    // Sort
    switch (sortBy) {
      case "recent":
        query = query.order("minted_at", { ascending: false })
        break
      case "price_low":
        query = query.order("current_price", { ascending: true })
        break
      case "price_high":
        query = query.order("current_price", { ascending: false })
        break
      case "rarity":
        query = query.order("rarity_score", { ascending: false })
        break
    }

    const { data, error } = await query.limit(50)

    if (!error && data) {
      setNfts(data as any)
    }
    setLoading(false)
  }

  async function fetchCollections() {
    const { data, error } = await supabase
      .from("nft_collections")
      .select("*")
      .eq("is_active", true)
      .order("total_volume", { ascending: false })

    if (!error && data) {
      setCollections(data)
    }
  }

  async function fetchFavorites() {
    if (!address) return

    const { data, error } = await supabase
      .from("nft_favorites")
      .select("nft_id")
      .eq("user_address", address)

    if (!error && data) {
      setFavorites(new Set(data.map((f) => f.nft_id)))
    }
  }

  async function toggleFavorite(nftId: string) {
    if (!address) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to favorite NFTs",
      })
      return
    }

    const isFavorited = favorites.has(nftId)

    if (isFavorited) {
      await supabase
        .from("nft_favorites")
        .delete()
        .eq("nft_id", nftId)
        .eq("user_address", address)

      setFavorites((prev) => {
        const next = new Set(prev)
        next.delete(nftId)
        return next
      })
    } else {
      await supabase.from("nft_favorites").insert({
        nft_id: nftId,
        user_address: address,
      })

      setFavorites((prev) => new Set(prev).add(nftId))
    }
  }

  function handlePurchase(nft: MusicNFT & { collection?: NFTCollection }) {
    setSelectedNft(nft)
    setShowPurchaseModal(true)
  }

  const filteredNfts = nfts.filter((nft) => {
    const metadata = nft.metadata as any
    const searchLower = searchQuery.toLowerCase()
    return (
      metadata?.name?.toLowerCase().includes(searchLower) ||
      metadata?.description?.toLowerCase().includes(searchLower) ||
      nft.collection?.collection_name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters and Search */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={selectedCollection} onValueChange={setSelectedCollection}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.collection_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Rarities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recently Listed
                </div>
              </SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rarity">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Rarity
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Badge variant="secondary" className="text-sm">
            {filteredNfts.length} NFTs
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-xl font-bold">
                {collections.reduce((sum, c) => sum + (c.total_volume || 0), 0).toFixed(2)} USDC
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collections</p>
              <p className="text-xl font-bold">{collections.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Grid3x3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total NFTs</p>
              <p className="text-xl font-bold">{nfts.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Floor Price</p>
              <p className="text-xl font-bold">
                {Math.min(...nfts.map((n) => n.current_price || 0)).toFixed(2)} USDC
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* NFT Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading NFTs...</p>
        </div>
      ) : filteredNfts.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No NFTs found</h3>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {filteredNfts.map((nft) => (
            <VinylRecordCard
              key={nft.id}
              nft={nft}
              onPurchase={() => handlePurchase(nft)}
              onFavorite={() => toggleFavorite(nft.id)}
              isFavorited={favorites.has(nft.id)}
              showPrice={true}
            />
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <NFTPurchaseModal
        nft={selectedNft}
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        onSuccess={() => {
          fetchNFTs()
        }}
      />
    </div>
  )
}
