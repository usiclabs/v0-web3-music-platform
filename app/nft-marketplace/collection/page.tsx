"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { createBrowserClient } from "@/lib/supabase/client"
import { VinylRecordCard } from "@/components/nft/vinyl-record-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Grid3x3, Sparkles, TrendingUp, Music } from 'lucide-react'
import { NFTPurchaseModal } from "@/components/nft/nft-purchase-modal"
import Link from "next/link"
import type { MusicNFT, NFTCollection } from "@/types/nft"

export default function MyCollectionPage() {
  const { address } = useAccount()
  const supabase = createBrowserClient()

  const [ownedNfts, setOwnedNfts] = useState<(MusicNFT & { collection?: NFTCollection })[]>([])
  const [createdNfts, setCreatedNfts] = useState<(MusicNFT & { collection?: NFTCollection })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNft, setSelectedNft] = useState<(MusicNFT & { collection?: NFTCollection }) | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  useEffect(() => {
    if (address) {
      fetchOwnedNfts()
      fetchCreatedNfts()
    }
  }, [address])

  async function fetchOwnedNfts() {
    const { data, error } = await supabase
      .from("music_nfts")
      .select(`
        *,
        collection:nft_collections(*)
      `)
      .eq("owner_address", address)
      .order("minted_at", { ascending: false })

    if (!error && data) {
      setOwnedNfts(data as any)
    }
    setLoading(false)
  }

  async function fetchCreatedNfts() {
    const { data, error } = await supabase
      .from("music_nfts")
      .select(`
        *,
        collection:nft_collections(*)
      `)
      .eq("creator_address", address)
      .order("minted_at", { ascending: false })

    if (!error && data) {
      setCreatedNfts(data as any)
    }
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view your NFT collection
          </p>
        </Card>
      </div>
    )
  }

  const totalValue = ownedNfts.reduce((sum, nft) => sum + (nft.current_price || 0), 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My NFT Collection</h1>
          <p className="text-muted-foreground">View and manage your music NFTs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Grid3x3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owned NFTs</p>
                <p className="text-2xl font-bold">{ownedNfts.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{totalValue.toFixed(2)} USDC</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Music className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold">{createdNfts.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="owned">
          <TabsList>
            <TabsTrigger value="owned">Owned ({ownedNfts.length})</TabsTrigger>
            <TabsTrigger value="created">Created ({createdNfts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : ownedNfts.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No NFTs owned yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse the marketplace to collect your first music NFT
                </p>
                <Link href="/nft-marketplace">
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ownedNfts.map((nft) => (
                  <VinylRecordCard
                    key={nft.id}
                    nft={nft}
                    showPrice={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="created" className="mt-6">
            {createdNfts.length === 0 ? (
              <Card className="p-12 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No NFTs created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Mint your first music NFT and start earning
                </p>
                <Link href="/nft-marketplace/mint">
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Mint NFT
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {createdNfts.map((nft) => (
                  <VinylRecordCard
                    key={nft.id}
                    nft={nft}
                    showPrice={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Purchase Modal */}
      <NFTPurchaseModal
        nft={selectedNft}
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        onSuccess={() => {
          fetchOwnedNfts()
          fetchCreatedNfts()
        }}
      />
    </div>
  )
}
