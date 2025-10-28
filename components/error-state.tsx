"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorState({ title = "Something went wrong", message, onRetry, showRetry = true }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative bg-destructive/10 backdrop-blur-xl border border-destructive/30 rounded-full p-8">
          <AlertCircle className="h-16 w-16 text-destructive animate-pulse" />
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-balance">{title}</h3>
      <p className="text-foreground/70 mb-8 max-w-md text-pretty leading-relaxed">{message}</p>
      {showRetry && onRetry && (
        <Button
          size="lg"
          variant="outline"
          onClick={onRetry}
          className="rounded-full px-8 gap-2 hover:scale-105 transition-transform border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 bg-transparent"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}
