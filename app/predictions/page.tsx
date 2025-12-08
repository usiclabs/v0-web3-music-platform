"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, DollarSign, Target, Music, Coins, Search, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface PredictionMarket {
  id: string
  title: string
  description: string
  category: string
  target_name: string
  target_image_url: string | null
  outcome_threshold: number
  outcome_metric: string
  resolution_date: string
  yes_probability: number
  total_volume: number
  is_active: boolean
}

export default function PredictionsPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMarkets()
  }, [filter])

  const fetchMarkets = async () => {
    try {
      const res = await fetch(`/api/predictions/markets?filter=${filter}`)
      const data = await res.json()
      setMarkets(data)
    } catch (error) {
      console.error("[v0] Error fetching markets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "streams":
        return <Music className="h-4 w-4" />
      case "market_cap":
        return <Coins className="h-4 w-4" />
      case "followers":
        return <Users className="h-4 w-4" />
      case "revenue":
        return <DollarSign className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "streams":
        return "bg-blue-500/10 text-blue-500"
      case "market_cap":
        return "bg-emerald-500/10 text-emerald-500"
      case "followers":
        return "bg-purple-500/10 text-purple-500"
      case "revenue":
        return "bg-amber-500/10 text-amber-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const filteredMarkets = markets.filter(
    (market) =>
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.target_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">MusicFi Predictions</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bet on artist success, token performance, and music industry outcomes
              </p>
            </div>
            <Link href="/predictions/create">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Market
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={setFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="ending_soon">Ending Soon</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-card/50" />
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No markets found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search query</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMarkets.map((market) => (
              <Link key={market.id} href={`/predictions/${market.id}`}>
                <Card className="group h-full cursor-pointer transition-all hover:border-accent hover:shadow-lg">
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between">
                      <Badge className={`gap-1 ${getCategoryColor(market.category)}`}>
                        {getCategoryIcon(market.category)}
                        {market.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="inline h-3 w-3" /> {formatDistanceToNow(new Date(market.resolution_date))}
                      </span>
                    </div>

                    {/* Market Title */}
                    <h3 className="mt-4 line-clamp-2 text-lg font-semibold text-foreground group-hover:text-accent">
                      {market.title}
                    </h3>

                    {/* Artist/Token Info */}
                    <div className="mt-3 flex items-center gap-2">
                      {market.target_image_url ? (
                        <img
                          src={market.target_image_url || "/placeholder.svg"}
                          alt={market.target_name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted" />
                      )}
                      <span className="text-sm text-muted-foreground">{market.target_name}</span>
                    </div>

                    {/* Probability */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">YES</span>
                        <span className="font-mono text-2xl font-bold text-emerald-500">{market.yes_probability}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${market.yes_probability}%` }}
                        />
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-mono font-medium">${market.total_volume.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="border-t border-border bg-card/30">
        <div className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Browse by Category</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Streams", icon: Music, color: "blue", desc: "Will artists reach stream milestones?" },
              { name: "Market Cap", icon: Coins, color: "emerald", desc: "Token market cap predictions" },
              { name: "Followers", icon: Users, color: "purple", desc: "Artist growth forecasts" },
              { name: "Revenue", icon: DollarSign, color: "amber", desc: "Earnings predictions" },
            ].map((category) => (
              <Card
                key={category.name}
                className="cursor-pointer p-6 transition-all hover:border-accent hover:shadow-lg"
              >
                <category.icon className={`h-8 w-8 text-${category.color}-500`} />
                <h3 className="mt-3 font-semibold">{category.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
