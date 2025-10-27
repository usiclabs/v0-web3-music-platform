import { createClient } from "./client"

/**
 * Ensures a profile exists for the given wallet address.
 * Creates a basic profile if one doesn't exist.
 */
export async function ensureProfile(walletAddress: string) {
  const supabase = createClient()

  const normalizedAddress = walletAddress.toLowerCase()

  // Try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", normalizedAddress)
    .maybeSingle()

  // If profile exists, return it
  if (existingProfile) {
    return { data: existingProfile, error: null }
  }

  // If error is not "no rows", throw it
  if (fetchError && fetchError.code !== "PGRST116") {
    return { data: null, error: fetchError }
  }

  // Create new profile with normalized address
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      wallet_address: normalizedAddress,
      artist_name: `Artist ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
      bio: null,
      avatar_url: null,
    })
    .select()
    .single()

  return { data: newProfile, error: insertError }
}
