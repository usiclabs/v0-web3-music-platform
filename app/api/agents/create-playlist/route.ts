import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// AI Curator Agent Address (registered via ERC-8004)
const AI_CURATOR_ADDRESS = "0xAI000000000000000000000000000000CURATOR1"

export async function POST(request: NextRequest) {
  try {
    const { theme, userId } = await request.json()

    if (!theme) {
      return NextResponse.json({ error: "Theme is required" }, { status: 400 })
    }

    console.log("[v0] AI Curator generating playlist for theme:", theme)

    const supabase = createAdminClient()

    // Fetch all active tracks
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id, title, artist_id, cover_url, created_at, ai_generated, ai_style")
      .eq("is_active", true)
      .eq("is_hidden", false)
      .limit(100)

    if (tracksError || !tracks) {
      console.error("[v0] Error fetching tracks:", tracksError)
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
    }

    // AI selection logic based on theme
    let selectedTracks: typeof tracks = []
    const lowerTheme = theme.toLowerCase()

    if (lowerTheme.includes("ai") || lowerTheme.includes("generated")) {
      // Select AI-generated tracks
      selectedTracks = tracks.filter((t) => t.ai_generated).slice(0, 10)
    } else if (lowerTheme.includes("new") || lowerTheme.includes("latest")) {
      // Select newest tracks
      selectedTracks = tracks
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
    } else if (lowerTheme.includes("chill") || lowerTheme.includes("relax")) {
      // Select tracks with chill-related styles
      selectedTracks = tracks
        .filter((t) => t.ai_style?.toLowerCase().includes("chill") || t.ai_style?.toLowerCase().includes("ambient"))
        .slice(0, 10)
    } else if (lowerTheme.includes("energy") || lowerTheme.includes("workout")) {
      // Select high-energy tracks
      selectedTracks = tracks
        .filter((t) => t.ai_style?.toLowerCase().includes("electronic") || t.ai_style?.toLowerCase().includes("rock"))
        .slice(0, 10)
    } else {
      // Default: random selection
      selectedTracks = tracks.sort(() => Math.random() - 0.5).slice(0, 10)
    }

    // Create playlist
    const playlistName = `${theme} - Curated by AI`
    const playlistDescription = `An AI-curated playlist featuring tracks perfect for ${theme}. Created by the platform's autonomous music curator agent.`

    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .insert({
        name: playlistName,
        description: playlistDescription,
        owner_address: AI_CURATOR_ADDRESS,
        is_public: true,
      })
      .select()
      .single()

    if (playlistError || !playlist) {
      console.error("[v0] Error creating playlist:", playlistError)
      return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
    }

    // Add tracks to playlist
    const playlistTracks = selectedTracks.map((track, index) => ({
      playlist_id: playlist.id,
      track_id: track.id,
      position: index,
    }))

    const { error: tracksInsertError } = await supabase.from("playlist_tracks").insert(playlistTracks)

    if (tracksInsertError) {
      console.error("[v0] Error adding tracks to playlist:", tracksInsertError)
      // Delete the playlist if we can't add tracks
      await supabase.from("playlists").delete().eq("id", playlist.id)
      return NextResponse.json({ error: "Failed to add tracks to playlist" }, { status: 500 })
    }

    console.log("[v0] AI Curator created playlist:", playlist.id, "with", selectedTracks.length, "tracks")

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlist,
        track_count: selectedTracks.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error in AI curator:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
