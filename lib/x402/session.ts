import { createClient } from "@/lib/supabase/server"

export interface TrackSession {
  id: string
  walletAddress: string
  trackId: string
  chainId: number
  signature?: string
  expiresAt: number
  createdAt: number
  lastAccessedAt: number
}

const SESSION_DURATION_DAYS = 90 // 3 months

export async function createTrackSession(
  walletAddress: string,
  trackId: string,
  chainId: number,
  signature?: string,
): Promise<TrackSession> {
  const supabase = await createClient()

  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from("x402_sessions")
    .upsert(
      {
        wallet_address: walletAddress.toLowerCase(),
        track_id: trackId,
        chain_id: chainId,
        signature,
        expires_at: expiresAt.toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: "wallet_address,track_id",
      },
    )
    .select()
    .single()

  if (error) {
    console.error("[v0] Failed to create session:", error)
    throw new Error("Failed to create track session")
  }

  console.log("[v0] Created/updated session for wallet:", walletAddress, "track:", trackId)

  return {
    id: data.id,
    walletAddress: data.wallet_address,
    trackId: data.track_id,
    chainId: data.chain_id,
    signature: data.signature,
    expiresAt: new Date(data.expires_at).getTime(),
    createdAt: new Date(data.created_at).getTime(),
    lastAccessedAt: new Date(data.last_accessed_at).getTime(),
  }
}

export async function checkTrackSession(walletAddress: string, trackId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("x402_sessions")
    .select("id, expires_at")
    .eq("wallet_address", walletAddress.toLowerCase())
    .eq("track_id", trackId)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !data) {
    return false
  }

  // Update last accessed time
  await supabase
    .from("x402_sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => console.log("[v0] Updated session last accessed:", data.id))
    .catch((err) => console.warn("[v0] Failed to update session access time:", err))

  return true
}

export async function getOwnedTracks(walletAddress: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("x402_sessions")
    .select("track_id")
    .eq("wallet_address", walletAddress.toLowerCase())
    .gt("expires_at", new Date().toISOString())

  if (error || !data) {
    console.error("[v0] Failed to get owned tracks:", error)
    return []
  }

  return data.map((row) => row.track_id)
}

export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("x402_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id")

  if (error) {
    console.error("[v0] Failed to cleanup sessions:", error)
    return 0
  }

  const count = data?.length || 0
  console.log(`[v0] Cleaned up ${count} expired sessions`)
  return count
}
