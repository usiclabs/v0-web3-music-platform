import { Suspense } from "react"
import { NFTMintForm } from "@/components/nft/nft-mint-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"

export const metadata = {
  title: "Mint Music NFT | MYUSIC",
  description: "Create limited edition music NFTs with 3D vinyl records",
}

export default function MintNFTPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/nft-marketplace">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold mb-2">Mint Music NFT</h1>
          <p className="text-muted-foreground">
            Create limited edition music NFTs as collectible 3D vinyl records
          </p>
        </div>

        {/* Mint Form */}
        <Suspense fallback={<div>Loading...</div>}>
          <NFTMintForm />
        </Suspense>
      </div>
    </div>
  )
}
