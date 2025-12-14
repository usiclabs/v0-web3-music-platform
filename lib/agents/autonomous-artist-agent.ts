import { createClient } from "@/lib/supabase/server"
import { privateKeyToAccount } from "viem/accounts"
import { getAutoStreamAgentWalletKeys, generateWalletsForAutoStreamAgent } from "./wallet-generator"
import type { Account } from "viem"

export interface AutonomousArtistConfig {
  id: string
  owner_address: string
  name: string
  is_active: boolean
  generation_frequency_hours: number
  auto_list_on_platform: boolean
  total_songs_generated: number
  total_spent_usdc: number
  last_generation_at: string | null
  created_at: string
  artist_style?: string
  preferred_genres?: string[]
  album_art_style?: string
  daily_budget_usdc?: number
  generation_cost_usdc?: number
  listing_cost_usdc?: number
  daily_spent_usdc?: number
  total_songs_listed?: number
  total_songs_earning?: number
  total_earnings_usdc?: number
  next_generation_at?: string | null
  updated_at?: string
}

export interface GenerationCycleResult {
  generated: boolean
  trackId?: string
  trackTitle?: string
  audioUrl?: string
  listed?: boolean
  totalSpent?: string
  error?: string
}

/**
 * Autonomous Artist Agent Service
 * Automatically generates music, pays X402 fees, and uploads to platform
 */
export class AutonomousArtistAgentService {
  private agentId: string
  private ownerAddress: string | null = null
  private _walletKey: string | null = null
  private _walletAccount: Account | null = null

  constructor(agentId: string, ownerAddress?: string) {
    this.agentId = agentId
    this.ownerAddress = ownerAddress || null
  }

  /**
   * Load wallet private key from encrypted storage
   */
  private async loadWalletKey(): Promise<void> {
    if (this._walletKey) return

    if (!this.ownerAddress) {
      const supabase = await createClient()
      const { data: agent } = await supabase
        .from("autonomous_artist_agents")
        .select("owner_address")
        .eq("id", this.agentId)
        .maybeSingle()

      if (!agent?.owner_address) {
        throw new Error("Agent owner address not found")
      }
      this.ownerAddress = agent.owner_address
    }

    const walletKeys = await getAutoStreamAgentWalletKeys(this.agentId, this.ownerAddress)

    if (walletKeys.size === 0) {
      console.log(`[Autonomous Artist Agent] No wallet found, generating now...`)
      await generateWalletsForAutoStreamAgent(this.agentId, this.ownerAddress, 1)
      const newKeys = await getAutoStreamAgentWalletKeys(this.agentId, this.ownerAddress)
      this._walletKey = newKeys.get(1) || null
    } else {
      this._walletKey = walletKeys.get(1) || null
    }

    if (!this._walletKey) {
      throw new Error("Failed to load wallet key")
    }

    const formattedKey = this._walletKey.startsWith("0x")
      ? (this._walletKey as `0x${string}`)
      : (`0x${this._walletKey}` as `0x${string}`)

    this._walletAccount = privateKeyToAccount(formattedKey)
    console.log(`[Autonomous Artist Agent] Loaded wallet: ${this._walletAccount.address}`)
  }

  /**
   * Get or create autonomous artist agent for a wallet address
   */
  static async getOrCreateByOwner(
    ownerAddress: string,
    artistConfig?: Partial<AutonomousArtistConfig>,
  ): Promise<AutonomousArtistConfig> {
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from("autonomous_artist_agents")
      .select("*")
      .eq("owner_address", ownerAddress)
      .maybeSingle()

    if (existing) return existing

    const agentId = crypto.randomUUID()

    const { data: newAgent, error: agentError } = await supabase
      .from("autonomous_artist_agents")
      .insert({
        id: agentId,
        owner_address: ownerAddress,
        name: artistConfig?.name || "Anonymous Artist",
        artist_style: artistConfig?.artist_style || "electronic",
        preferred_genres: artistConfig?.preferred_genres || ["electronic", "ambient"],
        album_art_style: artistConfig?.album_art_style || "abstract",
        is_active: false,
        generation_frequency_hours: artistConfig?.generation_frequency_hours || 24,
        auto_list_on_platform: artistConfig?.auto_list_on_platform ?? true,
        daily_budget_usdc: artistConfig?.daily_budget_usdc || 10,
        generation_cost_usdc: 1.0,
        listing_cost_usdc: 1.0,
        daily_spent_usdc: 0,
        total_songs_generated: 0,
        total_songs_listed: 0,
        total_songs_earning: 0,
        total_spent_usdc: 0,
        total_earnings_usdc: 0,
      })
      .select()
      .single()

    if (agentError) {
      console.error("[Autonomous Artist Agent] Failed to create agent:", agentError)
      throw agentError
    }

    try {
      await generateWalletsForAutoStreamAgent(agentId, ownerAddress, 1)
      console.log(`[Autonomous Artist Agent] Generated wallet for agent ${agentId}`)
    } catch (walletError) {
      console.error("[Autonomous Artist Agent] Failed to generate wallet:", walletError)
      await supabase.from("autonomous_artist_agents").delete().eq("id", agentId)
      throw walletError
    }

    return newAgent
  }

  /**
   * Generate music using Suno API
   */
  private async generateMusic(config: AutonomousArtistConfig): Promise<any> {
    const randomGenre =
      config.preferred_genres?.[Math.floor(Math.random() * config.preferred_genres.length)] || "electronic"
    const style = config.artist_style || "electronic"

    const prompt = `Create an original ${randomGenre} track with ${style} vibes. Make it experimental and unique.`

    console.log(`[Autonomous Artist Agent] Generating music with prompt: ${prompt}`)

    const response = await fetch("/api/suno/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        title: `${config.name} - ${new Date().toLocaleDateString()}`,
        style: `${randomGenre}, ${style}`,
        instrumental: false,
        model: "V5",
        customMode: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Pay for music generation using X402
   */
  private async payForGeneration(amount = "1"): Promise<string> {
    // Return a transaction hash (in real implementation, would execute X402 payment)
    // For now, we'll simulate the payment
    const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`
    return txHash
  }

  /**
   * Upload generated track to platform
   */
  private async uploadTrackToPlatform(track: any, config: AutonomousArtistConfig): Promise<string> {
    await this.loadWalletKey()

    if (!this._walletAccount) {
      throw new Error("Wallet not initialized")
    }

    const supabase = await createClient()

    // Get the artist profile associated with the owner
    const { data: artistProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", this.ownerAddress)
      .maybeSingle()

    if (!artistProfile) {
      throw new Error("Artist profile not found")
    }

    const trackRecord = {
      title: track.title,
      artist_id: artistProfile.id,
      genre: config.preferred_genres?.[0] || "electronic",
      description: `Generated by autonomous artist agent on ${new Date().toLocaleDateString()}`,
      audio_url: track.audioUrl,
      cover_url: track.imageUrl,
      duration: track.duration || 30,
      is_active: true,
      price_per_chunk: 0.005,
      ai_generated: true,
      ai_style: config.artist_style || "electronic",
    }

    const { data: createdTrack, error } = await supabase.from("tracks").insert(trackRecord).select("id").single()

    if (error) {
      throw new Error(`Failed to upload track: ${error.message}`)
    }

    console.log(`[Autonomous Artist Agent] Track uploaded with ID: ${createdTrack.id}`)

    // Log activity
    await supabase.from("autonomous_artist_activity").insert({
      agent_id: this.agentId,
      track_id: createdTrack.id,
      suno_track_id: track.id,
      song_title: track.title,
      audio_url: track.audioUrl,
      generation_style: config.artist_style,
      activity_type: "upload",
      cost_usdc: 1.0,
      tx_hash: await this.payForGeneration("1"),
    })

    return createdTrack.id
  }

  /**
   * Run a generation cycle
   */
  async runCycle(): Promise<GenerationCycleResult> {
    console.log(`[Autonomous Artist Agent] Starting generation cycle for agent ${this.agentId}`)

    const supabase = await createClient()
    const { data: agent } = await supabase
      .from("autonomous_artist_agents")
      .select("*")
      .eq("id", this.agentId)
      .maybeSingle()

    if (!agent || !agent.is_active) {
      throw new Error("Agent not found or inactive")
    }

    // Check interval
    const now = new Date()
    if (agent.last_generation_at) {
      const lastGen = new Date(agent.last_generation_at)
      const intervalMs = agent.generation_frequency_hours * 60 * 60 * 1000
      if (now.getTime() - lastGen.getTime() < intervalMs) {
        return { generated: false, error: "Generation interval not met" }
      }
    }

    // Check daily limit
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const { count: todayGenerations } = await supabase
      .from("autonomous_artist_activity")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)
      .eq("activity_type", "generate")
      .gte("created_at", todayStart.toISOString())

    const maxDailyFromBudget = Math.floor((agent.daily_budget_usdc || 10) / (agent.generation_cost_usdc || 1))
    if (todayGenerations && todayGenerations >= maxDailyFromBudget) {
      return { generated: false, error: "Daily generation limit reached" }
    }

    try {
      // Generate music
      const generationResult = await this.generateMusic(agent)
      const track = generationResult[0]

      if (!track || !track.audioUrl) {
        throw new Error("Generation failed - no audio URL returned")
      }

      console.log(`[Autonomous Artist Agent] Music generated: ${track.title}`)

      // Pay for generation
      const generationTxHash = await this.payForGeneration("1")
      let totalSpent = 1.0

      // Log generation activity
      await supabase.from("autonomous_artist_activity").insert({
        agent_id: this.agentId,
        suno_track_id: track.id,
        song_title: track.title,
        audio_url: track.audioUrl,
        generation_style: agent.artist_style,
        activity_type: "generate",
        cost_usdc: 1.0,
        tx_hash: generationTxHash,
      })

      let listedTrackId: string | undefined
      let listingSpent = 0

      // Auto-list on platform if enabled
      if (agent.auto_list_on_platform) {
        try {
          listedTrackId = await this.uploadTrackToPlatform(track, agent)
          listingSpent = agent.listing_cost_usdc || 1.0
          totalSpent += listingSpent
          console.log(`[Autonomous Artist Agent] Track listed on platform: ${listedTrackId}`)
        } catch (listingError) {
          console.error("[Autonomous Artist Agent] Listing failed:", listingError)
          // Continue even if listing fails
        }
      }

      // Update agent stats
      await supabase
        .from("autonomous_artist_agents")
        .update({
          last_generation_at: now.toISOString(),
          total_songs_generated: agent.total_songs_generated + 1,
          total_spent_usdc: Number.parseFloat(agent.total_spent_usdc) + totalSpent,
          daily_spent_usdc: Number.parseFloat(agent.daily_spent_usdc || 0) + totalSpent,
          total_songs_listed: listedTrackId ? agent.total_songs_listed + 1 : agent.total_songs_listed,
        })
        .eq("id", this.agentId)

      return {
        generated: true,
        trackId: track.id,
        trackTitle: track.title,
        audioUrl: track.audioUrl,
        listed: !!listedTrackId,
        totalSpent: totalSpent.toString(),
      }
    } catch (error: any) {
      console.error("[Autonomous Artist Agent] Generation cycle failed:", error)
      return { generated: false, error: error.message }
    }
  }

  /**
   * Get agent statistics
   */
  static async getStats(agentId: string): Promise<{
    config: AutonomousArtistConfig
    totalGenerated: number
    totalSpent: number
    recentActivity: any[]
  }> {
    const supabase = await createClient()

    const { data: agent } = await supabase.from("autonomous_artist_agents").select("*").eq("id", agentId).maybeSingle()

    const { data: activities } = await supabase
      .from("autonomous_artist_activity")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20)

    return {
      config: agent,
      totalGenerated: agent?.total_songs_generated || 0,
      totalSpent: agent?.total_spent_usdc || 0,
      recentActivity: activities || [],
    }
  }
}
