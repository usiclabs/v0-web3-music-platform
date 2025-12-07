import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3 } from "lucide-react"

export default function DexLoading() {
  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <main className="container relative z-10 py-4 md:py-8 px-3 md:px-4 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header Skeleton */}
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
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Advanced trading terminal for tokenized music assets
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 animate-fade-in-up">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-premium border-border/50">
              <CardContent className="p-3 md:pt-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-6 md:h-8 w-20 md:w-24" />
                    <Skeleton className="h-4 w-16 md:w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search/Filter Skeleton - Mobile */}
        <div className="flex gap-2 md:hidden">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-11 flex-shrink-0" />
        </div>

        {/* Search/Filter Skeleton - Desktop */}
        <Card className="glass-premium border-border/50 hidden md:block">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cards Skeleton */}
        <div className="space-y-2 md:hidden">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="glass-premium border-border/50">
              <CardContent className="p-3">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <Card className="glass-premium border-border/50 hidden md:block overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Table Header Skeleton */}
                <div className="border-b border-border/50 bg-muted/5">
                  <div className="grid grid-cols-[auto_1fr_repeat(6,auto)_auto] gap-4 px-6 py-3">
                    {[...Array(9)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-16" />
                    ))}
                  </div>
                </div>
                {/* Table Rows Skeleton */}
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_1fr_repeat(6,auto)_auto] gap-4 px-6 py-4 border-b border-border/50 last:border-0"
                  >
                    <Skeleton className="h-4 w-4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    {[...Array(6)].map((_, j) => (
                      <Skeleton key={j} className="h-4 w-16" />
                    ))}
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
