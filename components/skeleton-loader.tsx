export function SkeletonCard() {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden rounded-xl">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 skeleton rounded w-20" />
          <div className="h-8 w-8 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-xl">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-24" />
          <div className="h-8 skeleton rounded w-16" />
        </div>
      </div>
    </div>
  )
}
