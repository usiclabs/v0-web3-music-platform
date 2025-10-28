"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
        <div className="relative bg-card/30 backdrop-blur-xl border border-border/50 rounded-full p-8">
          <Icon className="h-16 w-16 text-primary animate-bounce-subtle" />
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-balance">{title}</h3>
      <p className="text-foreground/70 mb-8 max-w-md text-pretty leading-relaxed">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <>
          {actionHref ? (
            <Link href={actionHref}>
              <Button
                size="lg"
                className="rounded-full px-8 hover:scale-105 transition-transform shadow-lg shadow-primary/25"
              >
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={onAction}
              className="rounded-full px-8 hover:scale-105 transition-transform shadow-lg shadow-primary/25"
            >
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
