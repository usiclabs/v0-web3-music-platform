import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60 // Allow up to 60 seconds for export

export async function GET(request: NextRequest) {
  console.log("[v0] === AIRDROP EXPORT API CALLED ===")

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json" // json or csv
    const includeStats = searchParams.get("includeStats") === "true"

    console.log(`[v0] Airdrop export requested - Format: ${format}, Include Stats: ${includeStats}`)

    const supabase = await createClient()

    // Fetch all profiles to build base dataset
    console.log("[v0] Fetching all profiles...")
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("wallet_address, artist_name, avatar_url, created_at")

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    console.log(`[v0] Found ${profiles?.length || 0} profiles`)

    // Process each user's airdrop score
    const airdropRecipients = []

    for (const profile of profiles || []) {
      const userAddress = profile.wallet_address.toLowerCase()

      try {
        // Fetch user's streams
        const { data: streams } = await supabase
          .from("streams")
          .select("*, tracks!inner(id, title, artist_id)")
          .eq("listener_address", userAddress)

        // Fetch user's uploaded tracks
        const { data: uploads } = await supabase
          .from("tracks")
          .select("id")
          .eq("artist_id", userAddress)
          .eq("is_active", true)

        // Fetch user's likes (engagement)
        const { data: likes } = await supabase.from("likes").select("id").eq("user_address", userAddress)

        // Fetch user's follows (engagement)
        const { data: follows } = await supabase.from("follows").select("id").eq("follower_address", userAddress)

        const totalStreams = streams?.length || 0
        const uniqueArtists = new Set(streams?.map((s) => s.tracks?.artist_id) || []).size
        const fullTracksCompleted = streams?.filter((s) => s.chunks_played >= 10).length || 0
        const tracksUploaded = uploads?.length || 0
        const totalRevenue = streams?.reduce((sum, s) => sum + Number(s.total_paid || 0), 0) || 0
        const likesGiven = likes?.length || 0
        const followsGiven = follows?.length || 0
        const accountAge = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))

        // Check eligibility (20+ streams OR 1+ track)
        const isEligible = totalStreams >= 20 || tracksUploaded >= 1

        if (!isEligible) {
          console.log(`[v0] User ${userAddress} not eligible - streams: ${totalStreams}, tracks: ${tracksUploaded}`)
          continue
        }

        // Calculate airdrop score
        let streamScore = totalStreams
        streamScore += fullTracksCompleted * 10
        if (uniqueArtists > 10) streamScore += 25

        const uploadScore = tracksUploaded * 100
        const revenueScore = totalRevenue
        const engagementScore = likesGiven * 5 + followsGiven * 10

        let earlyUserScore = 0
        if (accountAge > 180) earlyUserScore = 500

        const referralScore = 0
        const totalScore = streamScore + uploadScore + revenueScore + engagementScore + earlyUserScore + referralScore

        // Calculate token allocation (5 billion total)
        const estimatedTokens = ((totalScore / 10000) * 5000000000).toFixed(0)

        airdropRecipients.push({
          wallet_address: userAddress,
          artist_name: profile.artist_name || "Unknown",
          is_eligible: true,
          total_score: totalScore,
          estimated_tokens_uusi: estimatedTokens,
          ...(includeStats && {
            stream_activity_score: streamScore,
            artist_uploads_score: uploadScore,
            music_sales_score: revenueScore,
            engagement_score: engagementScore,
            early_user_score: earlyUserScore,
            total_streams: totalStreams,
            unique_artists: uniqueArtists,
            full_tracks_completed: fullTracksCompleted,
            tracks_uploaded: tracksUploaded,
            total_revenue_usd: totalRevenue,
            likes_given: likesGiven,
            follows_given: followsGiven,
            account_age_days: accountAge,
          }),
        })
      } catch (error) {
        console.error(`[v0] Error processing user ${userAddress}:`, error)
        // Continue to next user on error
      }
    }

    airdropRecipients.sort((a, b) => {
      const aTokens = BigInt(a.estimated_tokens_uusi)
      const bTokens = BigInt(b.estimated_tokens_uusi)
      return bTokens > aTokens ? 1 : bTokens < aTokens ? -1 : 0
    })

    console.log(`[v0] Airdrop export complete - ${airdropRecipients.length} eligible recipients`)

    if (format === "csv") {
      // Convert to CSV
      const headers = includeStats
        ? [
            "wallet_address",
            "artist_name",
            "total_score",
            "estimated_tokens_uusi",
            "stream_activity_score",
            "artist_uploads_score",
            "music_sales_score",
            "engagement_score",
            "early_user_score",
            "total_streams",
            "unique_artists",
            "full_tracks_completed",
            "tracks_uploaded",
            "total_revenue_usd",
            "likes_given",
            "follows_given",
            "account_age_days",
          ]
        : ["wallet_address", "artist_name", "total_score", "estimated_tokens_uusi"]

      const csv =
        headers.join(",") +
        "\n" +
        airdropRecipients
          .map((recipient) => {
            const values = headers.map((header) => {
              const value = recipient[header as keyof typeof recipient]
              // Quote CSV values that contain commas
              if (typeof value === "string" && value.includes(",")) {
                return `"${value}"`
              }
              return value
            })
            return values.join(",")
          })
          .join("\n")

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=airdrop-recipients.csv",
        },
      })
    }

    let totalTokens = BigInt(0)
    for (const recipient of airdropRecipients) {
      totalTokens += BigInt(recipient.estimated_tokens_uusi)
    }

    // Return JSON format
    return NextResponse.json(
      {
        status: "success",
        total_recipients: airdropRecipients.length,
        total_tokens_to_distribute: totalTokens.toString(),
        recipients: airdropRecipients,
        snapshot_date: new Date("2026-01-01T00:00:00Z").toISOString(),
        export_date: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error in airdrop export:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
