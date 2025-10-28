export function SkeletonCard() {
  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/30 overflow-hidden rounded-xl hover-lift animate-fade-in">
      <div className="aspect-square skeleton relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton rounded w-3/4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
        <div className="h-4 skeleton rounded w-1/2 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 skeleton rounded w-20 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
          <div className="h-8 w-8 skeleton rounded-full relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ animationDelay: "0.6s" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/30 p-6 rounded-xl hover-lift animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 skeleton rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-24 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          <div className="h-8 skeleton rounded w-16 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonTrackRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-card/20 backdrop-blur-xl border border-border/30 rounded-lg animate-fade-in">
      <div className="h-12 w-12 skeleton rounded-lg relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 skeleton rounded w-48 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
            style={{ animationDelay: "0.1s" }}
          />
        </div>
        <div className="h-3 skeleton rounded w-32 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
      <div className="h-8 w-20 skeleton rounded relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="relative h-[60vh] md:h-[70vh] overflow-hidden animate-fade-in">
      <div className="absolute inset-0 skeleton">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
      <div className="relative container h-full flex items-end pb-12 px-4 sm:px-6">
        <div className="max-w-2xl space-y-6">
          <div className="h-8 w-32 skeleton rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          <div className="h-16 skeleton rounded w-full max-w-lg relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          <div className="h-6 skeleton rounded w-48 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
          <div className="flex gap-4">
            <div className="h-14 w-32 skeleton rounded-full relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
                style={{ animationDelay: "0.6s" }}
              />
            </div>
            <div className="h-14 w-32 skeleton rounded-full relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
                style={{ animationDelay: "0.8s" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
