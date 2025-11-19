// NFT marketplace types
export interface NFTCollection {
  id: string
  artist_address: string
  contract_address: string
  collection_name: string
  collection_symbol: string
  description: string | null
  cover_image_url: string | null
  banner_image_url: string | null
  royalty_percentage: number
  total_supply: number
  minted_count: number
  floor_price: number | null
  total_volume: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MusicNFT {
  id: string
  collection_id: string
  track_id: string | null
  token_id: string
  token_uri: string
  owner_address: string | null
  creator_address: string
  edition_number: number
  total_editions: number
  mint_price: number
  current_price: number | null
  last_sale_price: number | null
  rarity_score: number | null
  rarity_tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null
  metadata: Record<string, any> | null
  is_listed: boolean
  minted_at: string
  created_at: string
}

export interface NFTListing {
  id: string
  nft_id: string
  seller_address: string
  price: number
  currency: string
  listing_type: 'fixed_price' | 'auction'
  auction_end_time: string | null
  min_bid: number | null
  current_bid: number | null
  highest_bidder: string | null
  status: 'active' | 'sold' | 'cancelled' | 'expired'
  created_at: string
  updated_at: string
  sold_at: string | null
}

export interface NFTSale {
  id: string
  nft_id: string
  listing_id: string | null
  seller_address: string
  buyer_address: string
  price: number
  currency: string
  royalty_paid: number
  platform_fee: number
  tx_hash: string | null
  sale_type: 'primary' | 'secondary'
  created_at: string
}

export interface NFTBid {
  id: string
  listing_id: string
  bidder_address: string
  bid_amount: number
  status: 'active' | 'outbid' | 'won' | 'refunded'
  tx_hash: string | null
  created_at: string
}

// Extended types with relations
export interface NFTWithCollection extends MusicNFT {
  collection: NFTCollection
}

export interface NFTWithListing extends MusicNFT {
  listing: NFTListing | null
}

export interface ListingWithNFT extends NFTListing {
  nft: MusicNFT
  collection: NFTCollection
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  animation_url?: string
  external_url?: string
  attributes: {
    trait_type: string
    value: string | number
  }[]
  properties?: {
    artist: string
    track_title: string
    duration: number
    genre?: string
    release_date?: string
    edition: string
  }
}
