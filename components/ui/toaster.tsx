"use client"

import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-[100] flex flex-col gap-2 max-w-sm md:w-full mx-auto md:mx-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom md:slide-in-from-right",
            "bg-background border-border backdrop-blur-sm",
            toast.variant === "default" && "border-border",
            toast.variant === "destructive" && "border-red-500/50 bg-red-500/10",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
              {toast.description && <div className="text-sm text-muted-foreground mt-1">{toast.description}</div>}
            </div>
            {toast.action}
            <button
              onClick={() => dismiss(toast.id)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
