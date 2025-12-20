"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Users,
  DollarSign,
  Target,
  Music,
  Coins,
  Search,
  Plus,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react"
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
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="container relative mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge with Sparkles */}
            <Badge className="mb-3 gap-1 bg-accent/10 text-accent hover:bg-accent/20 sm:mb-4">
              <Sparkles className="h-3 w-3" />
              MusicFi Prediction Markets
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Bet on the Future of <span className="text-accent">Music</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              Predict artist success, token performance, and music industry outcomes. Trade on what you know, earn from
              what you believe.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 sm:mt-10">
              <Link href="/predictions/create" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 shadow-lg shadow-accent/20 h-12 sm:h-auto">
                  <Plus className="h-5 w-5" />
                  Create Market
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 bg-transparent h-12 sm:h-auto">
                <Activity className="h-5 w-5" />
                Browse Markets
              </Button>
            </div>

            <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-8 rounded-2xl border border-border bg-card/50 p-4 sm:p-6 backdrop-blur">
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold text-accent">{markets.length}</p>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">Active</p>
              </div>
              <div className="border-x border-border text-center">
                <p className="text-xl sm:text-3xl font-bold text-accent">
                  ${(markets.reduce((sum, m) => sum + m.total_volume, 0) / 1000).toFixed(0)}K
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">Volume</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold text-accent">Live</p>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">Auto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-auto transition-all focus:shadow-lg"
              />
            </div>
            <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-4 sm:w-auto h-10">
                <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm px-2">
                  <Target className="h-3 w-3" />
                  <span className="hidden sm:inline">All</span>
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-1 text-xs sm:text-sm px-2">
                  <Activity className="h-3 w-3" />
                  <span className="hidden sm:inline">Active</span>
                </TabsTrigger>
                <TabsTrigger value="ending_soon" className="gap-1 text-xs sm:text-sm px-2">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">Soon</span>
                </TabsTrigger>
                <TabsTrigger value="resolved" className="gap-1 text-xs sm:text-sm px-2">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">Done</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-12">
        {loading ? (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-72 sm:h-80 animate-pulse bg-card/50" />
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <Card className="mx-auto max-w-md p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-muted">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold">No markets found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or create a new prediction market
            </p>
            <Link href="/predictions/create">
              <Button className="mt-4 sm:mt-6 gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Create Market
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMarkets.map((market, index) => (
              <Link key={market.id} href={`/predictions/${market.id}`}>
                <Card className="group relative h-full overflow-hidden transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:shadow-2xl sm:hover:shadow-accent/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        className={`gap-1 transition-all text-xs sm:text-sm truncate ${getCategoryColor(market.category)}`}
                      >
                        {getCategoryIcon(market.category)}
                        <span className="hidden sm:inline">{market.category}</span>
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        <span className="hidden sm:inline text-xs">
                          {formatDistanceToNow(new Date(market.resolution_date))}
                        </span>
                        <span className="sm:hidden text-xs">
                          {formatDistanceToNow(new Date(market.resolution_date), { addSuffix: false }).split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3 sm:mt-4 line-clamp-2 text-base sm:text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">
                      {market.title}
                    </h3>

                    <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3">
                      {market.target_image_url ? (
                        <img
                          src={market.target_image_url || "/placeholder.svg"}
                          alt={market.target_name}
                          className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover ring-2 ring-border shrink-0"
                        />
                      ) : (
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                        {market.target_name}
                      </span>
                    </div>

                    <div className="mt-4 sm:mt-6">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">YES</p>
                          <p className="mt-0.5 sm:mt-1 font-mono text-2xl sm:text-3xl font-bold text-emerald-500">
                            {market.yes_probability}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">NO</p>
                          <p className="mt-0.5 sm:mt-1 font-mono text-lg sm:text-xl font-bold text-red-500">
                            {100 - market.yes_probability}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-3 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-500/20 to-emerald-500/20">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
                          style={{ width: `${market.yes_probability}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 flex items-center justify-between border-t border-border pt-3 sm:pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="mt-0.5 font-mono text-xs sm:text-sm font-semibold">
                          $
                          {market.total_volume >= 1000
                            ? `${(market.total_volume / 1000).toFixed(1)}K`
                            : market.total_volume.toFixed(0)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-accent opacity-100 sm:opacity-0 transition-all group-hover:opacity-100 h-8 text-xs sm:text-sm"
                      >
                        Trade
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Browse by Category</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Explore prediction markets across different music metrics
            </p>
          </div>
          {/* Added better responsive layout for category cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Streams",
                icon: Music,
                color: "blue",
                desc: "Predict stream milestones",
                count: markets.filter((m) => m.category === "streams").length,
              },
              {
                name: "Market Cap",
                icon: Coins,
                color: "emerald",
                desc: "Token market cap predictions",
                count: markets.filter((m) => m.category === "market_cap").length,
              },
              {
                name: "Followers",
                icon: Users,
                color: "purple",
                desc: "Artist growth forecasts",
                count: markets.filter((m) => m.category === "followers").length,
              },
              {
                name: "Revenue",
                icon: DollarSign,
                color: "amber",
                desc: "Earnings predictions",
                count: markets.filter((m) => m.category === "revenue").length,
              },
            ].map((category) => {
              const IconComponent = category.icon
              return (
                <Link
                  key={category.name}
                  href={`/predictions?category=${category.name.toLowerCase()}`}
                  className="w-full"
                >
                  <Card className="group cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:shadow-xl h-full">
                    <div className="relative p-4 sm:p-6">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br from-${category.color}-500/5 to-${category.color}-500/0 opacity-0 transition-opacity group-hover:opacity-100`}
                      />

                      <div className="relative">
                        <div className={`inline-flex rounded-xl bg-${category.color}-500/10 p-2 sm:p-3`}>
                          <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 text-${category.color}-500`} />
                        </div>
                        <h3 className="mt-3 sm:mt-4 text-base sm:text-xl font-semibold">{category.name}</h3>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none">
                          {category.desc}
                        </p>

                        <div className="mt-3 sm:mt-4 flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {category.count}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-100 sm:opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
