"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
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
    <div className="space-y-4 mb-8">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card/50 backdrop-blur-xl border-border/50"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full sm:w-[200px] h-10 px-3 rounded-md bg-card/50 backdrop-blur-xl border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="earnings-high">Highest Earnings</option>
          <option value="earnings-low">Lowest Earnings</option>
          <option value="tracks-high">Most Tracks</option>
          <option value="tracks-low">Fewest Tracks</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative ${hasActiveFilters ? "border-primary text-primary" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasActiveFilters && <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-4 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Advanced Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Minimum Earnings (USDC)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minEarnings}
                onChange={(e) => onMinEarningsChange(Number.parseFloat(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Minimum Tracks</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={minTracks}
                onChange={(e) => onMinTracksChange(Number.parseInt(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {totalResults} {totalResults === 1 ? "artist" : "artists"}
      </div>
    </div>
  )
}
