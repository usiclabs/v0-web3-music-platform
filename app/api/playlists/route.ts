import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 })
  }

  console.log("[v0] Fetching playlists for address:", address)

  try {
    const supabase = await createServerClient()

    const { data: playlists, error } = await supabase
      .from("playlists")
      .select(`
        *,
        playlist_tracks(count)
      `)
      .ilike("owner_address", address)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching playlists:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Found playlists:", playlists?.length || 0)

    return NextResponse.json(playlists || [])
  } catch (error) {
    console.error("[v0] Failed to fetch playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, ownerAddress, isPublic = true } = body

    if (!name || !ownerAddress) {
      return NextResponse.json({ error: "Name and owner address required" }, { status: 400 })
    }

    console.log("[v0] Creating playlist:", { name, ownerAddress })

    const supabase = createAdminClient()

    const { data: playlist, error } = await supabase
      .from("playlists")
      .insert({
        name,
        description,
        owner_address: ownerAddress.toLowerCase(),
        is_public: isPublic,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating playlist:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created playlist:", playlist.id)

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("[v0] Failed to create playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
