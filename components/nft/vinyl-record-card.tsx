"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VinylRecord3D } from "./vinyl-record-3d"
import { Heart, Play, ShoppingCart, TrendingUp } from 'lucide-react'
import { formatAddress } from "@/lib/utils"
import type { MusicNFT, NFTCollection } from "@/types/nft"

interface VinylRecordCardProps {
  nft: MusicNFT & { collection?: NFTCollection }
  onPurchase?: () => void
  onFavorite?: () => void
  isFavorited?: boolean
  showPrice?: boolean
}

export function VinylRecordCard({
  nft,
  onPurchase,
  onFavorite,
  isFavorited = false,
  showPrice = true,
}: VinylRecordCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const metadata = nft.metadata as any

  return (
    <Card
      className="group relative overflow-hidden bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Vinyl Record */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-black to-zinc-900">
        <VinylRecord3D
          coverImage={metadata?.image || nft.collection?.cover_image_url}
          rarity={nft.rarity_tier || "common"}
          autoRotate={!isHovered}
          className="w-full h-full"
        />

        {/* Hover overlay with actions */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full"
            onClick={onFavorite}
          >
            <Heart
              className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
            />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full"
          >
            <Play className="h-5 w-5" />
          </Button>
          {showPrice && (
            <Button
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onPurchase}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Edition badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="backdrop-blur-sm bg-black/50">
            {nft.edition_number}/{nft.total_editions}
          </Badge>
        </div>
      </div>

      {/* NFT Details */}
      <div className="p-4 space-y-3">
        {/* Collection name */}
        {nft.collection && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {nft.collection.collection_name}
          </p>
        )}

        {/* NFT name */}
        <h3 className="font-semibold text-lg line-clamp-1">
          {metadata?.name || `Edition #${nft.edition_number}`}
        </h3>

        {/* Artist */}
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          by {formatAddress(nft.creator_address)}
        </p>

        {/* Price and stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {showPrice && nft.current_price && (
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold">{nft.current_price} USDC</p>
            </div>
          )}
          
          {nft.last_sale_price && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="h-3 w-3" />
                Last Sale
              </p>
              <p className="text-sm text-green-500">{nft.last_sale_price} USDC</p>
            </div>
          )}
        </div>

        {/* Action button */}
        {showPrice && onPurchase && (
          <Button className="w-full" onClick={onPurchase}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        )}
      </div>
    </Card>
  )
}
