"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TrendingUp, TrendingDown, Search, Star, BarChart3, Activity, DollarSign, Droplets, Users, ArrowUpDown, ExternalLink, Music, UserIcon, Zap, ChevronRight, SlidersHorizontal, Filter } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"
import Link from "next/link"
import { TokenSwapDrawer } from "@/components/token-swap-drawer"

interface TokenData {
  id: string
  name: string
  symbol: string
  address: string
  type: "track" | "profile"
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  liquidity: number
  holders: number
  txns24h: number
  image: string
  artistName?: string
}

type SortField = "price" | "priceChange24h" | "volume24h" | "marketCap" | "liquidity" | "txns24h"
type SortDirection = "asc" | "desc"

export default function DexPage() {
  const { isConnected } = useWallet()
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("volume24h")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<"all" | "track" | "profile">("all")
  const [priceChangeFilter, setPriceChangeFilter] = useState<"all" | "gainers" | "losers">("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)

  useEffect(() => {
    loadTokens()
    const savedFavorites = localStorage.getItem("dexFavorites")
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("dexFavorites", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  const loadTokens = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Fetch track tokens
      const { data: trackData, error: trackError } = await supabase
        .from("tracks")
        .select(
          `
          *,
          profiles!tracks_artist_id_fkey (artist_name)
        `,
        )
        .or("coin_address.not.is.null,nft_contract_address.not.is.null")
        .eq("is_active", true)
        .eq("is_hidden", false)
        .limit(100)

      if (trackError) throw trackError

      // Fetch profile tokens
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .not("profile_token_address", "is", null)
        .limit(100)

      if (profileError) throw profileError

      // Format and merge tokens
      const formattedTracks: TokenData[] = await Promise.all(
        trackData.map(async (track: any) => {
          const metrics = await fetchTokenMetrics(track.coin_address)
          return {
            id: track.id,
            name: track.title,
            symbol: track.title.substring(0, 6).toUpperCase(),
            address: track.coin_address,
            type: "track" as const,
            price: metrics.price,
            priceChange24h: metrics.priceChange24h,
            volume24h: metrics.volume24h,
            marketCap: metrics.marketCap,
            liquidity: metrics.liquidity,
            holders: metrics.holders,
            txns24h: metrics.txns24h,
            image: track.cover_url || "/diverse-group-making-music.png",
            artistName: track.profiles?.artist_name || "Unknown",
          }
        }),
      )

      const formattedProfiles: TokenData[] = await Promise.all(
        profileData.map(async (profile: any) => {
          const metrics = await fetchTokenMetrics(profile.profile_token_address)
          return {
            id: `profile-${profile.wallet_address}`,
            name: `${profile.artist_name || "Unknown"} Token`,
            symbol: (profile.artist_name || "USER").substring(0, 4).toUpperCase(),
            address: profile.profile_token_address,
            type: "profile" as const,
            price: metrics.price,
            priceChange24h: metrics.priceChange24h,
            volume24h: metrics.volume24h,
            marketCap: metrics.marketCap,
            liquidity: metrics.liquidity,
            holders: metrics.holders,
            txns24h: metrics.txns24h,
            image: profile.avatar_url || "/abstract-geometric-shapes.png",
            artistName: profile.artist_name,
          }
        }),
      )

      setTokens([...formattedTracks, ...formattedProfiles])
    } catch (error) {
      console.error("[v0] Failed to load tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTokenMetrics = async (tokenAddress: string) => {
    try {
      const response = await fetch(`/api/token/metrics/${tokenAddress}`)
      if (!response.ok) throw new Error("Failed to fetch metrics")
      return await response.json()
    } catch (error) {
      return {
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        liquidity: 0,
        holders: 0,
        txns24h: 0,
      }
    }
  }

  const toggleFavorite = (tokenAddress: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(tokenAddress)) {
        newFavorites.delete(tokenAddress)
      } else {
        newFavorites.add(tokenAddress)
      }
      return newFavorites
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleTrade = (token: TokenData) => {
    setSelectedToken(token)
  }

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter((token) => {
      const matchesSearch =
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = filterType === "all" || token.type === filterType

      const matchesPriceChange =
        priceChangeFilter === "all" ||
        (priceChangeFilter === "gainers" && token.priceChange24h > 0) ||
        (priceChangeFilter === "losers" && token.priceChange24h < 0)

      return matchesSearch && matchesType && matchesPriceChange
    })

    return filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const multiplier = sortDirection === "asc" ? 1 : -1
      return (aValue - bValue) * multiplier
    })
  }, [tokens, searchQuery, sortField, sortDirection, filterType, priceChangeFilter])

  const aggregateStats = useMemo(() => {
    return {
      totalVolume: tokens.reduce((sum, t) => sum + t.volume24h, 0),
      totalMarketCap: tokens.reduce((sum, t) => sum + t.marketCap, 0),
      totalLiquidity: tokens.reduce((sum, t) => sum + t.liquidity, 0),
      avgPriceChange: tokens.length > 0 ? tokens.reduce((sum, t) => sum + t.priceChange24h, 0) / tokens.length : 0,
    }
  }, [tokens])

  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
    return value.toFixed(0)
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <main className="container relative z-10 py-4 md:py-8 px-3 md:px-4 max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="space-y-3 md:space-y-4 animate-fade-in">
          <div className="flex items-start md:items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-primary/50 p-2 md:p-3 rounded-xl">
                <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
                Music Token DEX
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">Advanced trading terminal for tokenized music assets</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <Card className="glass-premium border-border/50 hover-lift">
            <CardContent className="p-3 md:pt-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-green-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-base md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(aggregateStats.totalVolume)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">24h Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium border-border/50 hover-lift">
            <CardContent className="p-3 md:pt-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-blue-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-base md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(aggregateStats.totalMarketCap)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Market Cap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium border-border/50 hover-lift">
            <CardContent className="p-3 md:pt-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-purple-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                  <Droplets className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-base md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(aggregateStats.totalLiquidity)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Liquidity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium border-border/50 hover-lift">
            <CardContent className="p-3 md:pt-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`${aggregateStats.avgPriceChange >= 0 ? "bg-green-500/10" : "bg-red-500/10"} p-1.5 md:p-2 rounded-lg flex-shrink-0`}>
                  <Activity className={`h-4 w-4 md:h-5 md:w-5 ${aggregateStats.avgPriceChange >= 0 ? "text-green-500" : "text-red-500"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-base md:text-2xl lg:text-3xl font-bold ${aggregateStats.avgPriceChange >= 0 ? "text-green-500" : "text-red-500"} truncate`}>
                    {aggregateStats.avgPriceChange >= 0 ? "+" : ""}
                    {aggregateStats.avgPriceChange.toFixed(2)}%
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Avg Change</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 md:hidden animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-premium border-border/50 h-11"
            />
          </div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="glass-premium border-border/50 h-11 w-11 flex-shrink-0">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="glass-premium border-t border-border/50 rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Filter & Sort</SheetTitle>
                <SheetDescription>Customize your token view</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token Type</label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="glass-premium border-border/50">
                      <SelectValue placeholder="Token Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tokens</SelectItem>
                      <SelectItem value="track">Track Tokens</SelectItem>
                      <SelectItem value="profile">Profile Tokens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Movement</label>
                  <Select value={priceChangeFilter} onValueChange={(value: any) => setPriceChangeFilter(value)}>
                    <SelectTrigger className="glass-premium border-border/50">
                      <SelectValue placeholder="Price Movement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Changes</SelectItem>
                      <SelectItem value="gainers">Gainers Only</SelectItem>
                      <SelectItem value="losers">Losers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                    <SelectTrigger className="glass-premium border-border/50">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume24h">Volume 24h</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="priceChange24h">24h Change</SelectItem>
                      <SelectItem value="marketCap">Market Cap</SelectItem>
                      <SelectItem value="liquidity">Liquidity</SelectItem>
                      <SelectItem value="txns24h">Transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Card className="glass-premium border-border/50 animate-fade-in-up hidden md:block" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-premium border-border/50"
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="glass-premium border-border/50">
                  <SelectValue placeholder="Token Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="track">Track Tokens</SelectItem>
                  <SelectItem value="profile">Profile Tokens</SelectItem>
                </SelectContent>
              </Select>

              {/* Price Change Filter */}
              <Select value={priceChangeFilter} onValueChange={(value: any) => setPriceChangeFilter(value)}>
                <SelectTrigger className="glass-premium border-border/50">
                  <SelectValue placeholder="Price Movement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Changes</SelectItem>
                  <SelectItem value="gainers">Gainers Only</SelectItem>
                  <SelectItem value="losers">Losers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card Layout */}
        <div className="space-y-2 md:hidden animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="glass-premium border-border/50">
                <CardContent className="p-3">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredAndSortedTokens.length === 0 ? (
            <Card className="glass-premium border-border/50">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No tokens found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedTokens.map((token) => (
              <Card key={token.id} className="glass-premium border-border/50 hover-lift active:scale-[0.98] transition-all">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Token Image & Favorite */}
                    <div className="relative flex-shrink-0">
                      <img src={token.image || "/placeholder.svg"} alt={token.name} className="h-14 w-14 rounded-xl object-cover" />
                      <button
                        onClick={() => toggleFavorite(token.address)}
                        className="absolute -top-1 -right-1 bg-background/90 backdrop-blur-sm rounded-full p-1 border border-border/50"
                      >
                        <Star
                          className={`h-3 w-3 ${favorites.has(token.address) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                        />
                      </button>
                    </div>

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-semibold text-sm truncate">{token.name}</p>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
                              {token.type === "track" ? <Music className="h-2.5 w-2.5" /> : <UserIcon className="h-2.5 w-2.5" />}
                            </Badge>
                          </div>
                          {token.artistName && <p className="text-[10px] text-muted-foreground truncate">{token.artistName}</p>}
                        </div>
                        <div className={`flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {token.priceChange24h >= 0 ? "+" : ""}
                          {token.priceChange24h.toFixed(1)}%
                        </div>
                      </div>

                      {/* Price & Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Price</p>
                          <p className="text-xs font-mono font-semibold">${token.price.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Volume</p>
                          <p className="text-xs font-mono font-semibold">{formatCurrency(token.volume24h)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">MCap</p>
                          <p className="text-xs font-mono font-semibold">{formatCurrency(token.marketCap)}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild className="h-7 flex-1 text-xs">
                          <a
                            href={`https://basescan.org/token/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleTrade(token)}
                          className="h-7 flex-1 bg-primary hover:bg-primary/90 text-xs"
                        >
                          <Zap className="h-3 w-3" />
                          Trade
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="glass-premium border-border/50 animate-fade-in-up overflow-hidden hidden md:block" style={{ animationDelay: "300ms" }}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[250px]">Token</TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("price")}>
                    <div className="flex items-center gap-1">
                      Price
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("priceChange24h")}
                  >
                    <div className="flex items-center gap-1">
                      24h %
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("volume24h")}>
                    <div className="flex items-center gap-1">
                      Volume
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("marketCap")}>
                    <div className="flex items-center gap-1">
                      Market Cap
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("liquidity")}>
                    <div className="flex items-center gap-1">
                      Liquidity
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("txns24h")}>
                    <div className="flex items-center gap-1">
                      Txns 24h
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSortedTokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <p className="text-muted-foreground">No tokens found matching your filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTokens.map((token) => (
                    <TableRow key={token.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(token.address)}
                          className="h-8 w-8"
                        >
                          <Star
                            className={`h-4 w-4 ${favorites.has(token.address) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={token.image || "/placeholder.svg"} alt={token.name} className="h-10 w-10 rounded-lg object-cover" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{token.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {token.type === "track" ? <Music className="h-3 w-3 mr-1" /> : <UserIcon className="h-3 w-3 mr-1" />}
                                {token.symbol}
                              </Badge>
                            </div>
                            {token.artistName && <p className="text-xs text-muted-foreground">{token.artistName}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">${token.price.toFixed(6)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {token.priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="font-semibold">
                            {token.priceChange24h >= 0 ? "+" : ""}
                            {token.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(token.volume24h)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(token.marketCap)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(token.liquidity)}</TableCell>
                      <TableCell className="font-mono">{formatNumber(token.txns24h)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" asChild className="h-8">
                            <a
                              href={`https://basescan.org/token/${token.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTrade(token)}
                            className="h-8 bg-primary hover:bg-primary/90"
                          >
                            <Zap className="h-3 w-3" />
                            Trade
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Footer CTA */}
        {!isConnected && (
          <Card className="glass-premium border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <CardContent className="p-4 md:pt-6 text-center">
              <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">Connect Your Wallet to Start Trading</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">Access advanced trading features and manage your music token portfolio</p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                <Zap className="h-5 w-5 mr-2" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {selectedToken && (
        <TokenSwapDrawer
          open={!!selectedToken}
          onOpenChange={(open) => !open && setSelectedToken(null)}
          tokenAddress={selectedToken.address as `0x${string}`}
          tokenName={selectedToken.name}
          tokenSymbol={selectedToken.symbol}
          tokenImage={selectedToken.image}
        />
      )}
    </div>
  )
}
