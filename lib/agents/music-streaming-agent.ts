import { createClient } from "@/lib/supabase/server"

export interface MusicStreamingAgent {
  id: string
  owner_address: string
  name: string
  is_active: boolean
  auto_play_enabled: boolean
  preferred_genres: string[]
  preferred_artists: string[]
  daily_listening_limit: number // in minutes
  minutes_listened_today: number
  auto_like_threshold: number // 0-100, will auto-like tracks above this score
  auto_follow_artists: boolean
  created_at: string
  last_active_at: string | null
}

export interface StreamingSession {
  agentId: string
  trackId: string
  startedAt: Date
  chunksPaid: number
  totalSpent: number
}

/**
 * Music Streaming Agent Service
 * Handles autonomous music consumption, discovering and streaming tracks
 */
export class MusicStreamingAgentService {
  private agentId: string
  private currentSession: StreamingSession | null = null

  constructor(agentId: string) {
    this.agentId = agentId
  }

  /**
   * Start autonomous streaming cycle
   */
  async startStreamingCycle(): Promise<{
    tracked: string
    chunksPlayed: number
    spent: number
    liked: boolean
  } | null> {
    try {
      const supabase = await createClient()

      // Get agent configuration
      const { data: agent, error: agentError } = await supabase
        .from("music_streaming_agents")
        .select("*")
        .eq("id", this.agentId)
        .single()

      if (agentError || !agent || !agent.is_active) {
        console.log("[StreamingAgent] Agent not found or inactive")
        return null
      }

      // Check daily listening limit
      if (agent.minutes_listened_today >= agent.daily_listening_limit) {
        console.log("[StreamingAgent] Daily listening limit reached")
        await this.logActivity("limit_reached", "Daily listening limit reached")
        return null
      }

      // Select a track to stream
      const track = await this.selectNextTrack(agent)
      if (!track) {
        console.log("[StreamingAgent] No suitable tracks found")
        return null
      }

      console.log(`[StreamingAgent] Selected track: ${track.title} by ${track.profiles?.artist_name}`)

      // Simulate streaming the track (in production, this would integrate with audio player)
      const result = await this.streamTrack(track, agent)

      await this.logActivity("streamed_track", `Streamed: ${track.title}`, {
        trackId: track.id,
        chunksPaid: result.chunksPaid,
        spent: result.spent,
      })

      // Update minutes listened
      const minutesListened = Math.ceil(track.duration / 60)
      await supabase
        .from("music_streaming_agents")
        .update({
          minutes_listened_today: agent.minutes_listened_today + minutesListened,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", this.agentId)

      return {
        tracked: track.title,
        chunksPlayed: result.chunksPaid,
        spent: result.spent,
        liked: result.liked,
      }
    } catch (error: any) {
      console.error("[StreamingAgent] Error in streaming cycle:", error)
      await this.logActivity("error", error.message)
      return null
    }
  }

  /**
   * Select next track to stream based on agent preferences
   */
  private async selectNextTrack(agent: MusicStreamingAgent): Promise<any | null> {
    const supabase = await createClient()

    let query = supabase
      .from("tracks")
      .select(
        `
        *,
        profiles!tracks_artist_id_fkey (
          artist_name,
          wallet_address
        )
      `,
      )
      .eq("is_active", true)
      .not("audio_url", "is", null)

    // Apply genre filter if set
    if (agent.preferred_genres && agent.preferred_genres.length > 0) {
      // Note: This assumes tracks have a genre field - adjust based on your schema
      // For now, we'll skip genre filtering
    }

    // Apply artist filter if set
    if (agent.preferred_artists && agent.preferred_artists.length > 0) {
      query = query.in("artist_id", agent.preferred_artists)
    }

    // Get random tracks
    const { data: tracks } = await query.limit(20)

    if (!tracks || tracks.length === 0) {
      return null
    }

    // Select a random track
    const randomIndex = Math.floor(Math.random() * tracks.length)
    return tracks[randomIndex]
  }

  /**
   * Stream a track (simulates playing and paying for chunks)
   */
  private async streamTrack(
    track: any,
    agent: MusicStreamingAgent,
  ): Promise<{ chunksPaid: number; spent: number; liked: boolean }> {
    const supabase = await createClient()
    const CHUNK_DURATION = 30 // seconds
    const PRICE_PER_CHUNK = 0.01 // USDC
    const totalChunks = Math.ceil(track.duration / CHUNK_DURATION)

    console.log(`[StreamingAgent] Streaming track with ${totalChunks} chunks`)

    // Record stream start
    await supabase.from("streams").insert({
      track_id: track.id,
      listener_address: agent.owner_address,
      chunks_played: totalChunks,
      total_paid: totalChunks * PRICE_PER_CHUNK,
    })

    // Evaluate track for auto-like
    const trackScore = await this.evaluateTrack(track)
    let liked = false

    if (trackScore >= agent.auto_like_threshold) {
      // Auto-like the track
      await supabase.from("likes").insert({
        track_id: track.id,
        user_address: agent.owner_address,
      })
      liked = true
      console.log(`[StreamingAgent] Auto-liked track (score: ${trackScore})`)
    }

    // Auto-follow artist if enabled
    if (agent.auto_follow_artists && track.artist_id) {
      const { data: existingFollow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_address", agent.owner_address)
        .eq("following_address", track.artist_id)
        .single()

      if (!existingFollow) {
        await supabase.from("follows").insert({
          follower_address: agent.owner_address,
          following_address: track.artist_id,
        })
        console.log(`[StreamingAgent] Auto-followed artist: ${track.profiles?.artist_name}`)
      }
    }

    return {
      chunksPaid: totalChunks,
      spent: totalChunks * PRICE_PER_CHUNK,
      liked,
    }
  }

  /**
   * Evaluate track quality (simple scoring algorithm)
   */
  private async evaluateTrack(track: any): Promise<number> {
    const supabase = await createClient()

    // Get track stats
    const [{ count: likesCount }, { count: streamsCount }] = await Promise.all([
      supabase.from("likes").select("*", { count: "exact", head: true }).eq("track_id", track.id),
      supabase.from("streams").select("*", { count: "exact", head: true }).eq("track_id", track.id),
    ])

    let score = 50 // Base score

    // Popularity bonus
    if ((likesCount || 0) > 100) score += 20
    else if ((likesCount || 0) > 10) score += 10

    if ((streamsCount || 0) > 1000) score += 20
    else if ((streamsCount || 0) > 100) score += 10

    // Newer tracks get a slight boost
    const ageInDays = (Date.now() - new Date(track.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays < 7) score += 10

    return Math.min(100, score)
  }

  /**
   * Log agent activity
   */
  private async logActivity(activityType: string, description: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("agent_activity_log").insert({
        agent_id: this.agentId,
        activity_type: activityType,
        description,
        metadata,
      })
    } catch (error) {
      console.error("[StreamingAgent] Failed to log activity:", error)
    }
  }
}
