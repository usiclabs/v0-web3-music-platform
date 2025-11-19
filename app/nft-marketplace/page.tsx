import { Suspense } from "react"
import { NFTMarketplaceBrowse } from "@/components/nft/nft-marketplace-browse"
import { Button } from "@/components/ui/button"
import { Sparkles } from 'lucide-react'
import Link from "next/link"

export const metadata = {
  title: "NFT Marketplace | MYUSIC",
  description: "Discover and collect limited edition music NFTs as 3D vinyl records",
}

export default function NFTMarketplacePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
            Music NFT Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Collect limited edition music as stunning 3D vinyl records. Own a piece of music history.
          </p>
          <Link href="/nft-marketplace/mint">
            <Button size="lg" className="group">
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Mint Your NFT
            </Button>
          </Link>
        </div>
      </div>

      {/* Marketplace Browse */}
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
        <NFTMarketplaceBrowse />
      </Suspense>
    </div>
  )
}
