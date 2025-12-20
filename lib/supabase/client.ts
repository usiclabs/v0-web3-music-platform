import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("[v0] Supabase environment variables not configured")
    // Return a dummy client that won't break - it will fail gracefully on actual queries
    return createSupabaseBrowserClient(url || "", key || "")
  }

  return createSupabaseBrowserClient(url, key)
}

export const createBrowserClient = createClient
