"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Clock, TrendingUp, Music, User, ListMusic, Loader2 } from "lucide-react"
import { TrackCard } from "@/components/track-card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SearchFilter = "all" | "tracks" | "artists" | "playlists"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<SearchFilter>("all")
  const [results, setResults] = useState<any>({ tracks: [], artists: [], playlists: [] })
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  useEffect(() => {
    loadSearchHistory()
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      // Debounce autocomplete
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        loadSuggestions()
      }, 300)
    } else {
      setSuggestions([])
    }
  }, [query])

  async function loadSearchHistory() {
    try {
      const res = await fetch("/api/search/history")
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error("Failed to load search history:", error)
    }
  }

  async function loadSuggestions() {
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error)
    }
  }

  async function performSearch() {
    if (!query.trim()) return

    setLoading(true)
    setShowSuggestions(false)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)

        // Save to history
        await fetch("/api/search/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, result_type: filter === "all" ? null : filter }),
        })
        loadSearchHistory()
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function clearHistory() {
    try {
      await fetch("/api/search/history", { method: "DELETE" })
      setHistory([])
    } catch (error) {
      console.error("Failed to clear history:", error)
    }
  }

  const totalResults = results.tracks.length + results.artists.length + results.playlists.length

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      </div>

      <main className="container relative z-10 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Search</h1>
            </div>
            <p className="text-muted-foreground text-lg">Find tracks, artists, and playlists</p>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for tracks, artists, playlists..."
                className="pl-12 pr-12 h-14 text-lg bg-card/50 backdrop-blur-xl border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && performSearch()}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("")
                    setResults({ tracks: [], artists: [], playlists: [] })
                    setSuggestions([])
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl z-50 overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion.text)
                      setShowSuggestions(false)
                      performSearch()
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left"
                  >
                    {suggestion.type === "track" ? (
                      <Music className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{suggestion.text}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              All
            </Button>
            <Button
              variant={filter === "tracks" ? "default" : "outline"}
              onClick={() => setFilter("tracks")}
              className="gap-2"
            >
              <Music className="h-4 w-4" />
              Tracks
            </Button>
            <Button
              variant={filter === "artists" ? "default" : "outline"}
              onClick={() => setFilter("artists")}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Artists
            </Button>
            <Button
              variant={filter === "playlists" ? "default" : "outline"}
              onClick={() => setFilter("playlists")}
              className="gap-2"
            >
              <ListMusic className="h-4 w-4" />
              Playlists
            </Button>
          </div>

          {/* Search History */}
          {!query && history.length > 0 && (
            <div className="mb-8 bg-card/30 backdrop-blur-xl border border-border/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Searches
                </h3>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  Clear
                </Button>
              </div>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setQuery(item.query)
                      if (item.result_type) setFilter(item.result_type)
                      performSearch()
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{item.query}</span>
                    {item.result_type && (
                      <span className="ml-auto text-xs text-muted-foreground capitalize">{item.result_type}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Search Results */}
          {!loading && query && totalResults > 0 && (
            <div className="space-y-8">
              <p className="text-muted-foreground">
                Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
              </p>

              {/* Tracks */}
              {(filter === "all" || filter === "tracks") && results.tracks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Music className="h-6 w-6" />
                    Tracks ({results.tracks.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {results.tracks.map((track: any) => (
                      <TrackCard key={track.id} track={track} queue={results.tracks} />
                    ))}
                  </div>
                </div>
              )}

              {/* Artists */}
              {(filter === "all" || filter === "artists") && results.artists.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Artists ({results.artists.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {results.artists.map((artist: any) => (
                      <Link
                        key={artist.wallet_address}
                        href={`/artist/${artist.wallet_address}`}
                        className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 hover:bg-card/70 transition-all group"
                      >
                        <Avatar className="h-24 w-24 mx-auto mb-3 ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                          <AvatarImage src={artist.avatar_url || ""} />
                          <AvatarFallback>{artist.artist_name?.[0] || "A"}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-center truncate">{artist.artist_name}</h3>
                        {artist.bio && (
                          <p className="text-sm text-muted-foreground text-center truncate mt-1">{artist.bio}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlists */}
              {(filter === "all" || filter === "playlists") && results.playlists.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <ListMusic className="h-6 w-6" />
                    Playlists ({results.playlists.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {results.playlists.map((playlist: any) => (
                      <Link
                        key={playlist.id}
                        href={`/playlist/${playlist.id}`}
                        className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 hover:bg-card/70 transition-all group"
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-3 flex items-center justify-center">
                          <ListMusic className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="font-semibold truncate">{playlist.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {playlist.owner?.artist_name || "Unknown"}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!loading && query && totalResults === 0 && (
            <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-lg p-12 text-center">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try different keywords or check your spelling</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
