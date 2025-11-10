"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, X, TrendingUp, Music, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export type SortOption =
  | "newest"
  | "oldest"
  | "earnings-high"
  | "earnings-low"
  | "tracks-high"
  | "tracks-low"
  | "name-asc"
  | "name-desc"
  | "streams-high"
  | "streams-low"
  | "marketcap-high"
  | "marketcap-low"

interface ArtistsFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  minEarnings: number
  onMinEarningsChange: (value: number) => void
  minTracks: number
  onMinTracksChange: (value: number) => void
  totalResults: number
}

export function ArtistsFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  minEarnings,
  onMinEarningsChange,
  minTracks,
  onMinTracksChange,
  totalResults,
}: ArtistsFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = minEarnings > 0 || minTracks > 0

  const clearFilters = () => {
    onMinEarningsChange(0)
    onMinTracksChange(0)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
          Discover Artists
        </h2>
        <p className="text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? "artist" : "artists"} available
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search</label>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Find your favorite artist..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 bg-card/50 backdrop-blur-xl border-border/50 focus:border-primary/50 transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort By</label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full h-12 pl-4 pr-10 rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 cursor-pointer appearance-none"
          >
            <optgroup label="Market Cap">
              <option value="marketcap-high">🚀 Highest Market Cap</option>
              <option value="marketcap-low">📊 Lowest Market Cap</option>
            </optgroup>
            <optgroup label="Popularity">
              <option value="streams-high">🎵 Most Streams</option>
              <option value="streams-low">🎧 Fewest Streams</option>
            </optgroup>
            <optgroup label="Earnings">
              <option value="earnings-high">💰 Highest Earnings</option>
              <option value="earnings-low">💸 Lowest Earnings</option>
            </optgroup>
            <optgroup label="Content">
              <option value="tracks-high">🎼 Most Tracks</option>
              <option value="tracks-low">🎹 Fewest Tracks</option>
            </optgroup>
            <optgroup label="Joined">
              <option value="newest">🆕 Newest First</option>
              <option value="oldest">🕰️ Oldest First</option>
            </optgroup>
            <optgroup label="Name">
              <option value="name-asc">🔤 Name (A-Z)</option>
              <option value="name-desc">🔡 Name (Z-A)</option>
            </optgroup>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className={`w-full h-12 relative overflow-hidden transition-all duration-300 ${
          hasActiveFilters ? "border-primary text-primary hover:bg-primary/10" : "hover:bg-muted"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <SlidersHorizontal
            className={`h-4 w-4 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
          />
          <span className="font-medium">Advanced Filters</span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {(minEarnings > 0 ? 1 : 0) + (minTracks > 0 ? 1 : 0)}
            </span>
          )}
        </div>
      </Button>

      {showFilters && (
        <Card className="bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl border-border/50 p-6 space-y-6 animate-slide-down shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
              <h3 className="font-semibold text-lg">Advanced Filters</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/20">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                Minimum Earnings (USDC)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minEarnings || ""}
                onChange={(e) => onMinEarningsChange(Number.parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
              />
              {minEarnings > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Showing artists with at least {minEarnings.toFixed(4)} USDC earned
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                Minimum Tracks
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={minTracks || ""}
                onChange={(e) => onMinTracksChange(Number.parseInt(e.target.value) || 0)}
                placeholder="0"
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
              />
              {minTracks > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  Showing artists with at least {minTracks} {minTracks === 1 ? "track" : "tracks"}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
