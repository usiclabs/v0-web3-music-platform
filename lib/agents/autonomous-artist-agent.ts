import { createClient } from "@/lib/supabase/server"
import { privateKeyToAccount } from "viem/accounts"
import { getAutoStreamAgentWalletKeys, generateWalletsForAutoStreamAgent } from "./wallet-generator"
import type { Account } from "viem"

export interface AutonomousArtistConfig {
  id: string
  owner_address: string
  wallet_address: string
  artist_name: string
  artist_bio: string
  is_active: boolean
  generation_interval_hours: number
  max_daily_generations: number
  music_styles: string[]
  genres: string[]
  generation_prompt_template: string
  min_generation_duration: number
  max_generation_duration: number
  auto_list_on_platform: boolean
  total_generated_count: number
  total_spent_on_generation: string
  total_spent_on_listing: string
  last_generation_at: string | null
  created_at: string
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
        .single()

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

    // Create a temporary wallet
    const tempWalletKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    const formattedKey = `0x${tempWalletKey}` as `0x${string}`
    const tempWalletAccount = privateKeyToAccount(formattedKey)

    const { data: newAgent, error: agentError } = await supabase
      .from("autonomous_artist_agents")
      .insert({
        id: agentId,
        owner_address: ownerAddress,
        wallet_address: tempWalletAccount.address,
        artist_name: artistConfig?.artist_name || "Anonymous Artist",
        artist_bio: artistConfig?.artist_bio || "An AI-powered autonomous music creator",
        is_active: false,
        generation_interval_hours: artistConfig?.generation_interval_hours || 24,
        max_daily_generations: artistConfig?.max_daily_generations || 3,
        music_styles: artistConfig?.music_styles || ["electronic", "ambient"],
        genres: artistConfig?.genres || ["electronic"],
        generation_prompt_template:
          artistConfig?.generation_prompt_template ||
          "Create an original {genre} track with {styles} vibes. Make it experimental and unique.",
        min_generation_duration: artistConfig?.min_generation_duration || 20,
        max_generation_duration: artistConfig?.max_generation_duration || 40,
        auto_list_on_platform: artistConfig?.auto_list_on_platform ?? true,
        total_generated_count: 0,
        total_spent_on_generation: "0",
        total_spent_on_listing: "0",
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
    // Build the prompt from template
    const randomStyle = config.music_styles[Math.floor(Math.random() * config.music_styles.length)]
    const randomGenre = config.genres[Math.floor(Math.random() * config.genres.length)]

    const prompt = config.generation_prompt_template.replace("{genre}", randomGenre).replace("{styles}", randomStyle)

    console.log(`[Autonomous Artist Agent] Generating music with prompt: ${prompt}`)

    const response = await fetch("/api/suno/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        title: `${config.artist_name} - ${new Date().toLocaleDateString()}`,
        style: `${randomGenre}, ${randomStyle}`,
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
      .single()

    if (!artistProfile) {
      throw new Error("Artist profile not found")
    }

    // Create track record
    const trackRecord = {
      title: track.title,
      suno_track_id: track.id,
      artist_id: artistProfile.id,
      genre: config.genres[0],
      description: `Generated by autonomous artist agent on ${new Date().toLocaleDateString()}`,
      audio_url: track.audioUrl,
      image_url: track.imageUrl,
      duration: track.duration || 30,
      is_active: true,
      mint_price: 0.005,
      token_ticker: "MUSIC",
      agent_id: this.agentId,
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
      action: "upload",
      spent: "1.00",
      transaction_hash: await this.payForGeneration("1"),
    })

    return createdTrack.id
  }

  /**
   * Run a generation cycle
   */
  async runCycle(): Promise<GenerationCycleResult> {
    console.log(`[Autonomous Artist Agent] Starting generation cycle for agent ${this.agentId}`)

    const supabase = await createClient()
    const { data: agent } = await supabase.from("autonomous_artist_agents").select("*").eq("id", this.agentId).single()

    if (!agent || !agent.is_active) {
      throw new Error("Agent not found or inactive")
    }

    // Check interval
    const now = new Date()
    if (agent.last_generation_at) {
      const lastGen = new Date(agent.last_generation_at)
      const intervalMs = agent.generation_interval_hours * 60 * 60 * 1000
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
      .eq("action", "generate")
      .gte("created_at", todayStart.toISOString())

    if (todayGenerations && todayGenerations >= agent.max_daily_generations) {
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
      let totalSpent = "1.00"

      // Log generation activity
      await supabase.from("autonomous_artist_activity").insert({
        agent_id: this.agentId,
        track_id: track.id,
        action: "generate",
        spent: "1.00",
        transaction_hash: generationTxHash,
      })

      let listedTrackId: string | undefined
      let listingSpent = "0"

      // Auto-list on platform if enabled
      if (agent.auto_list_on_platform) {
        try {
          listedTrackId = await this.uploadTrackToPlatform(track, agent)
          listingSpent = "1.00"
          totalSpent = (Number.parseFloat(totalSpent) + Number.parseFloat(listingSpent)).toString()
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
          total_generated_count: agent.total_generated_count + 1,
          total_spent_on_generation: (Number.parseFloat(agent.total_spent_on_generation) + 1.0).toString(),
          total_spent_on_listing: (
            Number.parseFloat(agent.total_spent_on_listing) + Number.parseFloat(listingSpent)
          ).toString(),
        })
        .eq("id", this.agentId)

      return {
        generated: true,
        trackId: track.id,
        trackTitle: track.title,
        audioUrl: track.audioUrl,
        listed: !!listedTrackId,
        totalSpent,
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
    totalSpentOnGeneration: string
    totalSpentOnListing: string
    recentActivity: any[]
  }> {
    const supabase = await createClient()

    const { data: agent } = await supabase.from("autonomous_artist_agents").select("*").eq("id", agentId).single()

    const { data: activities } = await supabase
      .from("autonomous_artist_activity")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20)

    return {
      config: agent,
      totalGenerated: agent?.total_generated_count || 0,
      totalSpentOnGeneration: agent?.total_spent_on_generation || "0",
      totalSpentOnListing: agent?.total_spent_on_listing || "0",
      recentActivity: activities || [],
    }
  }
}
