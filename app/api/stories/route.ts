import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const artistAddress = searchParams.get("artistAddress")
    const viewerAddress = searchParams.get("viewerAddress")

    const supabase = await createServerClient()

    let query = supabase
      .from("stories")
      .select("*")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (artistAddress) {
      query = query.eq("artist_address", artistAddress)
    }

    const { data: stories, error } = await query

    if (error) {
      console.error("[Stories API] Error fetching stories:", error)
      return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 })
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({ artists: [] })
    }

    const uniqueArtistAddresses = [...new Set(stories.map((s) => s.artist_address))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("wallet_address, artist_name, avatar_url, profile_token_address")
      .in("wallet_address", uniqueArtistAddresses)

    const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

    // Get unique artists with stories
    const artistsWithStories = new Map()

    for (const story of stories) {
      const artistAddr = story.artist_address
      if (!artistsWithStories.has(artistAddr)) {
        const profile = profileMap.get(artistAddr) || {
          wallet_address: artistAddr,
          artist_name: `${artistAddr.slice(0, 6)}...${artistAddr.slice(-4)}`,
          avatar_url: null,
          profile_token_address: null,
        }

        artistsWithStories.set(artistAddr, {
          artist: profile,
          stories: [],
          hasUnviewed: false,
        })
      }
      artistsWithStories.get(artistAddr).stories.push(story)
    }

    // Check if viewer has viewed all stories for each artist
    if (viewerAddress) {
      for (const [artistAddr, data] of artistsWithStories.entries()) {
        const storyIds = data.stories.map((s: any) => s.id)
        const { data: views } = await supabase
          .from("story_views")
          .select("story_id")
          .in("story_id", storyIds)
          .eq("viewer_address", viewerAddress)

        const viewedIds = new Set(views?.map((v) => v.story_id) || [])
        data.hasUnviewed = data.stories.some((s: any) => !viewedIds.has(s.id))
      }
    }

    // Convert to array and sort by has unviewed first, then by latest story
    const artistsList = Array.from(artistsWithStories.values()).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1
      if (!a.hasUnviewed && b.hasUnviewed) return 1
      return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime()
    })

    return NextResponse.json({ artists: artistsList })
  } catch (error) {
    console.error("[Stories API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      artistAddress,
      mediaUrl,
      mediaType,
      thumbnailUrl,
      duration,
      caption,
      linkUrl,
      linkText,
      isTokenGated,
      requiredTokenAddress,
      requiredTokenAmount,
    } = body

    if (!artistAddress || !mediaUrl || !mediaType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: story, error } = await supabaseAdmin
      .from("stories")
      .insert({
        artist_address: artistAddress,
        media_url: mediaUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        duration: duration || (mediaType === "photo" ? 5 : 15),
        caption,
        link_url: linkUrl,
        link_text: linkText,
        is_token_gated: isTokenGated || false,
        required_token_address: requiredTokenAddress,
        required_token_amount: requiredTokenAmount || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[Stories API] Error creating story:", error)
      return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
    }

    return NextResponse.json({ story })
  } catch (error) {
    console.error("[Stories API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
