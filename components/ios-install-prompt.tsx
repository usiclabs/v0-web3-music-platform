"use client"

import { useState, useEffect } from "react"
import { X, Share, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if already installed (running in standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
    setIsInStandaloneMode(isStandalone)

    // Show prompt if iOS, not in standalone, and hasn't been dismissed
    if (isIOSDevice && !isStandalone) {
      const hasSeenPrompt = localStorage.getItem("ios-install-prompt-dismissed")
      if (!hasSeenPrompt) {
        // Delay showing the prompt for better UX
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("ios-install-prompt-dismissed", "true")
  }

  const handleRemindLater = () => {
    setShowPrompt(false)
    // Don't set localStorage, so it shows again next session
  }

  if (!isIOS || isInStandaloneMode || !showPrompt) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-4 mb-4 animate-in slide-in-from-bottom-5">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-background backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />

        <div className="relative p-6">
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full p-1 hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 p-3 shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-13a3 3 0 00-3 3v4a3 3 0 006 0v-4a3 3 0 00-3-3z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg mb-1">Install MyUSIC App</h3>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                Add MyUSIC to your home screen for a native app experience with offline access and faster loading.
              </p>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5 mb-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <Share className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/90 mb-1">1. Tap the Share button</p>
                  <p className="text-xs text-white/50">In Safari's bottom menu bar</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5 mb-5">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/20 border border-green-500/30">
                    <Plus className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/90 mb-1">2. Select "Add to Home Screen"</p>
                  <p className="text-xs text-white/50">Scroll down in the share menu</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemindLater}
                  className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                >
                  Remind Later
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                >
                  Not Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
