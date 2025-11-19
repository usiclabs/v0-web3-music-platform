-- Music NFT Collections table
CREATE TABLE IF NOT EXISTS public.nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_address TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  contract_address TEXT NOT NULL UNIQUE,
  collection_name TEXT NOT NULL,
  collection_symbol TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  banner_image_url TEXT,
  royalty_percentage INTEGER DEFAULT 10 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 100),
  total_supply INTEGER NOT NULL,
  minted_count INTEGER DEFAULT 0,
  floor_price DECIMAL(18,6),
  total_volume DECIMAL(18,6) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Music NFTs table (individual NFT tokens)
CREATE TABLE IF NOT EXISTS public.music_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.nft_collections(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  token_id TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  owner_address TEXT,
  creator_address TEXT NOT NULL,
  edition_number INTEGER NOT NULL,
  total_editions INTEGER NOT NULL,
  mint_price DECIMAL(18,6) NOT NULL,
  current_price DECIMAL(18,6),
  last_sale_price DECIMAL(18,6),
  rarity_score INTEGER,
  rarity_tier TEXT CHECK (rarity_tier IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  metadata JSONB,
  is_listed BOOLEAN DEFAULT FALSE,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, token_id)
);

-- NFT Marketplace Listings
CREATE TABLE IF NOT EXISTS public.nft_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID NOT NULL REFERENCES public.music_nfts(id) ON DELETE CASCADE,
  seller_address TEXT NOT NULL,
  price DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  listing_type TEXT CHECK (listing_type IN ('fixed_price', 'auction')) DEFAULT 'fixed_price',
  auction_end_time TIMESTAMPTZ,
  min_bid DECIMAL(18,6),
  current_bid DECIMAL(18,6),
  highest_bidder TEXT,
  status TEXT CHECK (status IN ('active', 'sold', 'cancelled', 'expired')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ
);

-- NFT Sales History
CREATE TABLE IF NOT EXISTS public.nft_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID NOT NULL REFERENCES public.music_nfts(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.nft_listings(id) ON DELETE SET NULL,
  seller_address TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  price DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  royalty_paid DECIMAL(18,6) DEFAULT 0,
  platform_fee DECIMAL(18,6) DEFAULT 0,
  tx_hash TEXT,
  sale_type TEXT CHECK (sale_type IN ('primary', 'secondary')) DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT Auction Bids
CREATE TABLE IF NOT EXISTS public.nft_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.nft_listings(id) ON DELETE CASCADE,
  bidder_address TEXT NOT NULL,
  bid_amount DECIMAL(18,6) NOT NULL,
  status TEXT CHECK (status IN ('active', 'outbid', 'won', 'refunded')) DEFAULT 'active',
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT Favorites
CREATE TABLE IF NOT EXISTS public.nft_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID NOT NULL REFERENCES public.music_nfts(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nft_id, user_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nft_collections_artist ON public.nft_collections(artist_address);
CREATE INDEX IF NOT EXISTS idx_nft_collections_contract ON public.nft_collections(contract_address);
CREATE INDEX IF NOT EXISTS idx_music_nfts_collection ON public.music_nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_music_nfts_owner ON public.music_nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_music_nfts_track ON public.music_nfts(track_id);
CREATE INDEX IF NOT EXISTS idx_nft_listings_seller ON public.nft_listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_nft_listings_status ON public.nft_listings(status);
CREATE INDEX IF NOT EXISTS idx_nft_sales_nft ON public.nft_sales(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_sales_buyer ON public.nft_sales(buyer_address);
CREATE INDEX IF NOT EXISTS idx_nft_sales_seller ON public.nft_sales(seller_address);
CREATE INDEX IF NOT EXISTS idx_nft_bids_listing ON public.nft_bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_nft_bids_bidder ON public.nft_bids(bidder_address);
CREATE INDEX IF NOT EXISTS idx_nft_favorites_user ON public.nft_favorites(user_address);

-- Enable Row Level Security
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nft_collections
CREATE POLICY "Anyone can view collections" ON public.nft_collections FOR SELECT USING (true);
CREATE POLICY "Artists can create collections" ON public.nft_collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Artists can update own collections" ON public.nft_collections FOR UPDATE USING (true);

-- RLS Policies for music_nfts
CREATE POLICY "Anyone can view NFTs" ON public.music_nfts FOR SELECT USING (true);
CREATE POLICY "System can mint NFTs" ON public.music_nfts FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update own NFTs" ON public.music_nfts FOR UPDATE USING (true);

-- RLS Policies for nft_listings
CREATE POLICY "Anyone can view active listings" ON public.nft_listings FOR SELECT USING (true);
CREATE POLICY "Owners can create listings" ON public.nft_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers can update own listings" ON public.nft_listings FOR UPDATE USING (true);

-- RLS Policies for nft_sales
CREATE POLICY "Anyone can view sales history" ON public.nft_sales FOR SELECT USING (true);
CREATE POLICY "System can record sales" ON public.nft_sales FOR INSERT WITH CHECK (true);

-- RLS Policies for nft_bids
CREATE POLICY "Anyone can view bids" ON public.nft_bids FOR SELECT USING (true);
CREATE POLICY "Users can place bids" ON public.nft_bids FOR INSERT WITH CHECK (true);

-- RLS Policies for nft_favorites
CREATE POLICY "Users can view own favorites" ON public.nft_favorites FOR SELECT USING (true);
CREATE POLICY "Users can add favorites" ON public.nft_favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove favorites" ON public.nft_favorites FOR DELETE USING (true);
