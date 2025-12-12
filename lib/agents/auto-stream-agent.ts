import { createClient } from "@/lib/supabase/server"
import { privateKeyToAccount } from "viem/accounts"
import { getAutoStreamAgentWalletKeys, generateWalletsForAutoStreamAgent } from "./wallet-generator"
import { requestChunk, settlePayment, type X402PaymentPayload } from "@/lib/x402/client"
import { createWalletClient, http, type Account } from "viem"
import { base } from "viem/chains"

export interface AutoStreamAgentConfig {
  id: string
  owner_address: string
  wallet_address: string
  is_active: boolean
  stream_interval_minutes: number
  max_daily_streams: number
  target_genres: string[]
  min_track_duration: number
  max_track_duration: number
  play_full_tracks: boolean
  randomize_timing: boolean
  last_stream_at: string | null
  total_streams_count: number
  total_amount_paid: string
}

export interface StreamCycleResult {
  streamed: boolean
  trackId?: string
  trackTitle?: string
  chunksPlayed?: number
  amountPaid?: string
  error?: string
}

/**
 * Auto Stream Agent Service
 * Automatically streams music tracks to boost platform usage
 */
export class AutoStreamAgentService {
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
        .from("auto_stream_agents")
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
      console.log(`[Auto Stream Agent] No wallet found, generating now...`)
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
    console.log(`[Auto Stream Agent] Loaded wallet: ${this._walletAccount.address}`)
  }

  /**
   * Get or create agent by owner address
   */
  static async getOrCreateByOwner(ownerAddress: string): Promise<AutoStreamAgentConfig> {
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from("auto_stream_agents")
      .select("*")
      .eq("owner_address", ownerAddress)
      .maybeSingle()

    if (existing) return existing

    const tempAgentId = crypto.randomUUID()

    // Create a temporary wallet just to get the address
    const tempWalletKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    const formattedKey = `0x${tempWalletKey}` as `0x${string}`
    const tempWalletAccount = privateKeyToAccount(formattedKey)

    // Insert agent record first
    const { data: newAgent, error: agentError } = await supabase
      .from("auto_stream_agents")
      .insert({
        id: tempAgentId,
        owner_address: ownerAddress,
        wallet_address: tempWalletAccount.address,
        is_active: false,
      })
      .select()
      .single()

    if (agentError) {
      console.error("[Auto Stream Agent] Failed to create agent:", agentError)
      throw agentError
    }

    try {
      await generateWalletsForAutoStreamAgent(tempAgentId, ownerAddress, 1)
      console.log(`[Auto Stream Agent] Generated wallet for agent ${tempAgentId}`)
    } catch (walletError) {
      console.error("[Auto Stream Agent] Failed to generate wallet:", walletError)
      // Clean up the agent record if wallet generation fails
      await supabase.from("auto_stream_agents").delete().eq("id", tempAgentId)
      throw walletError
    }

    return newAgent
  }

  /**
   * Get random track based on agent configuration
   */
  private async getRandomTrack(config: AutoStreamAgentConfig): Promise<any> {
    const supabase = await createClient()

    let query = supabase
      .from("tracks")
      .select("*, profiles!tracks_artist_id_fkey(*)")
      .eq("is_active", true)
      .gte("duration", config.min_track_duration)
      .lte("duration", config.max_track_duration)
      .limit(100)

    if (config.target_genres && config.target_genres.length > 0) {
      query = query.in("genre", config.target_genres)
    }

    const { data: tracks, error } = await query

    if (error || !tracks || tracks.length === 0) {
      console.error("[Auto Stream Agent] No tracks available:", error)
      throw new Error("No tracks available to stream")
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    return tracks[randomIndex]
  }

  /**
   * Sign USDC transfer authorization for X402 payment
   */
  private async signTransferAuthorization(
    from: string,
    to: string,
    value: bigint,
    validAfter: number,
    validBefore: number,
    nonce: string,
  ): Promise<{ v: number; r: string; s: string }> {
    if (!this._walletAccount) {
      throw new Error("Wallet not loaded")
    }

    const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base mainnet
    const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = "0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267"

    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: 8453,
      verifyingContract: USDC_ADDRESS as `0x${string}`,
    }

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    }

    const message = {
      from: from as `0x${string}`,
      to: to as `0x${string}`,
      value,
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce: nonce as `0x${string}`,
    }

    const client = createWalletClient({
      account: this._walletAccount,
      chain: base,
      transport: http(),
    })

    const signature = await client.signTypedData({
      account: this._walletAccount,
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message,
    })

    const r = signature.slice(0, 66)
    const s = `0x${signature.slice(66, 130)}`
    const v = Number.parseInt(signature.slice(130, 132), 16)

    return { v, r, s }
  }

  /**
   * Stream a single chunk of a track
   */
  private async streamChunk(trackId: string, chunkIndex: number): Promise<{ paid: string; txHash?: string }> {
    await this.loadWalletKey()

    if (!this._walletAccount) {
      throw new Error("Wallet not initialized")
    }

    const paymentInstructions = await requestChunk(trackId, chunkIndex, 8453)

    const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`

    const now = Math.floor(Date.now() / 1000)
    const validAfter = now - 3600
    const validBefore = now + 3600

    // The API returns amount as a string like "0.01" (1 cent), we need to convert to 10000 (smallest unit)
    const amountInWei = BigInt(Math.floor(Number.parseFloat(paymentInstructions.amount) * 1_000_000))

    const signature = await this.signTransferAuthorization(
      this._walletAccount.address,
      paymentInstructions.recipient,
      amountInWei,
      validAfter,
      validBefore,
      nonce,
    )

    const paymentPayload: X402PaymentPayload = {
      scheme: paymentInstructions.scheme,
      network: paymentInstructions.network,
      chainId: paymentInstructions.chainId,
      authorization: {
        from: this._walletAccount.address,
        to: paymentInstructions.recipient,
        value: amountInWei.toString(),
        validAfter,
        validBefore,
        nonce,
        v: signature.v,
        r: signature.r,
        s: signature.s,
      },
    }

    const result = await settlePayment(paymentPayload, trackId, this._walletAccount.address, chunkIndex)

    return { paid: paymentInstructions.amount, txHash: result.txHash }
  }

  /**
   * Log streaming activity
   */
  private async logActivity(
    trackId: string | null,
    chunksPlayed: number,
    amountPaid: string,
    completed: boolean,
    error?: string,
  ): Promise<void> {
    if (!trackId) {
      console.log("[Auto Stream Agent] Skipping activity log - no track ID")
      return
    }

    const supabase = await createClient()
    await supabase.from("auto_stream_activity").insert({
      agent_id: this.agentId,
      track_id: trackId,
      chunks_played: chunksPlayed,
      amount_paid: amountPaid,
      completed,
      error,
    })
  }

  /**
   * Run a streaming cycle
   */
  async runCycle(): Promise<StreamCycleResult> {
    console.log(`[Auto Stream Agent] Starting cycle for agent ${this.agentId}`)

    const supabase = await createClient()
    const { data: agent } = await supabase.from("auto_stream_agents").select("*").eq("id", this.agentId).single()

    if (!agent || !agent.is_active) {
      throw new Error("Agent not found or inactive")
    }

    const now = new Date()
    if (agent.last_stream_at) {
      const lastStream = new Date(agent.last_stream_at)
      const intervalMs = agent.stream_interval_minutes * 60 * 1000
      if (now.getTime() - lastStream.getTime() < intervalMs) {
        return { streamed: false, error: "Interval not met" }
      }
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const { count: todayStreams } = await supabase
      .from("auto_stream_activity")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)
      .gte("created_at", todayStart.toISOString())

    if (todayStreams && todayStreams >= agent.max_daily_streams) {
      return { streamed: false, error: "Daily limit reached" }
    }

    try {
      const track = await this.getRandomTrack(agent)
      console.log(`[Auto Stream Agent] Selected track: ${track.title} by ${track.profiles?.artist_name}`)

      const chunkDuration = 30
      const totalChunks = Math.ceil(track.duration / chunkDuration)
      const chunksToPlay = agent.play_full_tracks ? totalChunks : Math.min(3, totalChunks)

      let totalPaid = 0
      let lastTxHash: string | undefined

      for (let i = 0; i < chunksToPlay; i++) {
        const { paid, txHash } = await this.streamChunk(track.id, i)
        totalPaid += Number(paid)
        lastTxHash = txHash

        if (agent.randomize_timing && i < chunksToPlay - 1) {
          const delay = 5000 + Math.random() * 10000 // 5-15 seconds
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      await this.logActivity(track.id, chunksToPlay, totalPaid.toString(), true)

      await supabase
        .from("auto_stream_agents")
        .update({
          last_stream_at: now.toISOString(),
          total_streams_count: agent.total_streams_count + 1,
          total_amount_paid: (Number(agent.total_amount_paid) + totalPaid).toString(),
        })
        .eq("id", this.agentId)

      console.log(`[Auto Stream Agent] Successfully streamed ${chunksToPlay} chunks, paid ${totalPaid} USDC`)

      return {
        streamed: true,
        trackId: track.id,
        trackTitle: track.title,
        chunksPlayed: chunksToPlay,
        amountPaid: totalPaid.toString(),
      }
    } catch (error: any) {
      console.error("[Auto Stream Agent] Cycle failed:", error)
      await this.logActivity(null, 0, "0", false, error.message)
      return { streamed: false, error: error.message }
    }
  }

  /**
   * Get agent statistics
   */
  static async getStats(agentId: string): Promise<{
    totalStreams: number
    totalPaid: string
    recentActivity: any[]
  }> {
    const supabase = await createClient()

    const { data: agent } = await supabase.from("auto_stream_agents").select("*").eq("id", agentId).single()

    const { data: activities } = await supabase
      .from("auto_stream_activity")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(10)

    let recentActivity: any[] = []
    if (activities && activities.length > 0) {
      const trackIds = activities.map((a) => a.track_id).filter(Boolean)

      if (trackIds.length > 0) {
        const { data: tracks } = await supabase
          .from("tracks")
          .select("id, title, profiles(artist_name)")
          .in("id", trackIds)

        const trackMap = new Map(tracks?.map((t) => [t.id, t]) || [])

        recentActivity = activities.map((activity) => ({
          ...activity,
          tracks: trackMap.get(activity.track_id) || null,
        }))
      } else {
        recentActivity = activities
      }
    }

    return {
      totalStreams: agent?.total_streams_count || 0,
      totalPaid: agent?.total_amount_paid || "0",
      recentActivity,
    }
  }
}
