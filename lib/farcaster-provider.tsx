"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface FarcasterContextValue {
  isReady: boolean
  isFarcaster: boolean
  user: {
    fid?: number
    username?: string
    displayName?: string
    pfp?: string
  } | null
}

const FarcasterContext = createContext<FarcasterContextValue>({
  isReady: false,
  isFarcaster: false,
  user: null,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isFarcaster, setIsFarcaster] = useState(false)
  const [user, setUser] = useState<FarcasterContextValue["user"]>(null)

  useEffect(() => {
    async function initFarcaster() {
      try {
        // Detect Farcaster by checking for the miniapp SDK in the window object
        if (typeof window === 'undefined') {
          setIsReady(true)
          return
        }

        // Check if we're running in Farcaster by looking for Farcaster-specific indicators
        const isFarcasterEnv = window.location.hostname.includes('farcaster') || 
                              window.location.href.includes('fc://') ||
                              (window as any).__FARCASTER__

        if (!isFarcasterEnv) {
          console.log("[v0] Not in Farcaster environment, skipping SDK initialization")
          setIsReady(true)
          setIsFarcaster(false)
          return
        }

        console.log("[v0] Initializing Farcaster SDK...")

        // Dynamically import the SDK only on client side
        const { sdk } = await import("@farcaster/miniapp-sdk")

        let context
        try {
          context = await sdk.context
        } catch (contextError) {
          console.log("[v0] Could not access Farcaster context (cross-origin restriction):", contextError)
          setIsReady(true)
          setIsFarcaster(false)
          return
        }

        setIsFarcaster(!!context)

        if (context) {
          console.log("[v0] Running in Farcaster context", context.user)
          // Get user information
          setUser({
            fid: context.user?.fid,
            username: context.user?.username,
            displayName: context.user?.displayName,
            pfp: context.user?.pfpUrl,
          })
        } else {
          console.log("[v0] Not running in Farcaster context")
        }

        // Use requestAnimationFrame to ensure DOM is fully painted
        // and add additional delay to ensure all components are mounted
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              await sdk.actions.ready()
              setIsReady(true)
              console.log("[v0] Farcaster SDK ready() called successfully")
            } catch (error) {
              console.error("[v0] Error calling sdk.actions.ready():", error)
              setIsReady(true)
            }
          }, 100)
        })
      } catch (error) {
        // Not in Farcaster environment or SDK failed to load
        console.log("[v0] Not running in Farcaster environment or SDK failed", error)
        setIsReady(true)
        setIsFarcaster(false)
      }
    }

    initFarcaster()
  }, [])

  return <FarcasterContext.Provider value={{ isReady, isFarcaster, user }}>{children}</FarcasterContext.Provider>
}
