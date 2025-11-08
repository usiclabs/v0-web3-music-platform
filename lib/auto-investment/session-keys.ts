import { createClient } from "@/lib/supabase/server"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

export interface SessionKey {
  id: string
  user_address: string
  session_key: string
  spending_limit: number
  spent_amount: number
  max_per_transaction: number
  valid_from: string
  valid_until: string
  is_active: boolean
}

export interface AutoInvestmentSettings {
  enabled: boolean
  daily_limit: number
  per_track_limit: number
  auto_unlock_full_songs: boolean
  preferred_artists: string[]
}

/**
 * Create a new session key for automated investments
 */
export async function createSessionKey(
  userAddress: string,
  spendingLimit: number,
  maxPerTransaction: number,
  validityHours = 24,
): Promise<SessionKey> {
  const supabase = await createClient()

  // Generate a new private key for the session
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  const sessionAddress = account.address

  const validUntil = new Date()
  validUntil.setHours(validUntil.getHours() + validityHours)

  const { data, error } = await supabase
    .from("session_keys")
    .insert({
      user_address: userAddress.toLowerCase(),
      session_key: privateKey,
      spending_limit: spendingLimit,
      spent_amount: 0,
      max_per_transaction: maxPerTransaction,
      valid_until: validUntil.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get active session key for user
 */
export async function getActiveSessionKey(userAddress: string): Promise<SessionKey | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("session_keys")
    .select("*")
    .eq("user_address", userAddress.toLowerCase())
    .eq("is_active", true)
    .gt("valid_until", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

/**
 * Check if session key can spend amount
 */
export async function canSpend(sessionKeyId: string, amount: number): Promise<boolean> {
  const supabase = await createClient()

  const { data: sessionKey } = await supabase.from("session_keys").select("*").eq("id", sessionKeyId).single()

  if (!sessionKey || !sessionKey.is_active) return false

  const now = new Date()
  const validUntil = new Date(sessionKey.valid_until)
  if (now > validUntil) return false

  const remainingLimit = sessionKey.spending_limit - sessionKey.spent_amount
  return amount <= remainingLimit && amount <= sessionKey.max_per_transaction
}

/**
 * Record spending from session key
 */
export async function recordSpending(sessionKeyId: string, amount: number): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc("increment_session_spending", {
    session_id: sessionKeyId,
    amount,
  })

  await supabase.from("session_keys").update({ last_used_at: new Date().toISOString() }).eq("id", sessionKeyId)
}

/**
 * Revoke session key
 */
export async function revokeSessionKey(sessionKeyId: string): Promise<void> {
  const supabase = await createClient()

  await supabase.from("session_keys").update({ is_active: false }).eq("id", sessionKeyId)
}

/**
 * Get or create auto-investment settings
 */
export async function getAutoInvestmentSettings(userAddress: string): Promise<AutoInvestmentSettings> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("auto_investment_settings")
    .select("*")
    .eq("user_address", userAddress.toLowerCase())
    .maybeSingle()

  if (!data) {
    const { data: newSettings, error } = await supabase
      .from("auto_investment_settings")
      .insert({
        user_address: userAddress.toLowerCase(),
        enabled: false,
        daily_limit: 10.0,
        per_track_limit: 1.0,
        auto_unlock_full_songs: false,
        preferred_artists: [],
      })
      .select()
      .single()

    if (error) {
      console.error("[Auto-Investment] Error creating default settings:", error)
      // Return defaults even if insert fails
      return {
        enabled: false,
        daily_limit: 10.0,
        per_track_limit: 1.0,
        auto_unlock_full_songs: false,
        preferred_artists: [],
      }
    }

    return newSettings
  }

  return data
}

/**
 * Update auto-investment settings
 */
export async function updateAutoInvestmentSettings(
  userAddress: string,
  settings: Partial<AutoInvestmentSettings>,
): Promise<void> {
  const supabase = await createClient()

  await supabase.from("auto_investment_settings").upsert(
    {
      user_address: userAddress.toLowerCase(),
      ...settings,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_address",
    },
  )
}
