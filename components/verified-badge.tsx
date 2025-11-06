import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showLabel?: boolean
}

export function VerifiedBadge({ size = "md", className, showLabel = false }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="relative inline-flex">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/50 blur-md rounded-full animate-pulse-glow" />
        {/* Icon */}
        <CheckCircle
          className={cn(
            sizeClasses[size],
            "text-primary fill-primary/20 relative z-10 drop-shadow-[0_0_8px_rgba(224,62,62,0.6)]",
          )}
        />
      </div>
      {showLabel && <span className={cn(labelSizeClasses[size], "font-semibold text-primary")}>Verified</span>}
    </div>
  )
}
