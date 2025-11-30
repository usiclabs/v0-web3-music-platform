export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm animate-pulse">Loading MyUSIC...</p>
      </div>
    </div>
  )
}
