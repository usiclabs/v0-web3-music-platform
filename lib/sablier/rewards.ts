import { createClient } from "@/lib/supabase/client"

export interface RewardStream {
  id: string
  user_address: string
  stream_id: string
  token_address: string
  total_amount: string
  start_time: number
  end_time: number
  claimed_amount: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RewardClaim {
  id: string
  user_address: string
  stream_id: string
  amount: string
  tx_hash: string | null
  created_at: string
}

// Get user's active reward streams
export async function getUserStreams(userAddress: string): Promise<RewardStream[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("reward_streams")
    .select("*")
    .eq("user_address", userAddress.toLowerCase())
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch user streams:", error)
    return []
  }

  return data || []
}

// Get user's claim history
export async function getUserClaims(userAddress: string): Promise<RewardClaim[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("reward_claims")
    .select("*")
    .eq("user_address", userAddress.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Failed to fetch user claims:", error)
    return []
  }

  return data || []
}

// Record a new stream
export async function recordStream(stream: Omit<RewardStream, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("reward_streams")
    .insert({
      ...stream,
      user_address: stream.user_address.toLowerCase(),
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to record stream:", error)
    throw error
  }

  return data
}

// Record a claim
export async function recordClaim(claim: Omit<RewardClaim, "id" | "created_at">) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("reward_claims")
    .insert({
      ...claim,
      user_address: claim.user_address.toLowerCase(),
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to record claim:", error)
    throw error
  }

  return data
}

// Update claimed amount for a stream
export async function updateStreamClaimedAmount(streamId: string, claimedAmount: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("reward_streams")
    .update({
      claimed_amount: claimedAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("stream_id", streamId)

  if (error) {
    console.error("Failed to update stream:", error)
    throw error
  }
}

// Deactivate a stream
export async function deactivateStream(streamId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("reward_streams")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stream_id", streamId)

  if (error) {
    console.error("Failed to deactivate stream:", error)
    throw error
  }
}
