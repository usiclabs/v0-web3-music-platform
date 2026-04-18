import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let cachedClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createClient() {
  // Only initialize on client side
  if (typeof window === "undefined") {
    // Return a dummy client for server-side - won't actually be used
    return null as any
  }

  // Lazy initialize and cache the client
  if (!cachedClient) {
    cachedClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return cachedClient
}

export const createBrowserClient = createClient
