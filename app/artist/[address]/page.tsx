import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArtistProfilePremium } from "@/components/artist-profile-premium"

export default async function ArtistPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const normalizedAddress = address.toLowerCase()
  const supabase = await createClient()

  const { data: artist } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", normalizedAddress)
    .maybeSingle()

  if (!artist) {
    notFound()
  }

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_address", normalizedAddress)

  // Fetch artist's tracks
  const { data: tracks } = await supabase
    .from("tracks")
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(*)
    `)
    .eq("artist_id", normalizedAddress)
    .or("is_hidden.is.null,is_hidden.eq.false")
    .order("created_at", { ascending: false })

  const trackIds = tracks?.map((t) => t.id) || []

  let totalEarnings = 0

  if (trackIds.length > 0) {
    const { data: trackStreams } = await supabase
      .from("streams")
      .select("total_paid")
      .in("track_id", trackIds)

    if (trackStreams) {
      totalEarnings = trackStreams.reduce((sum, stream) => sum + Number(stream.total_paid || 0), 0)
    }
  }

  return (
    <ArtistProfilePremium
      artist={{
        artist_name: artist.artist_name || "Artist",
        avatar_url: artist.avatar_url || "",
        bio: artist.bio || "",
        wallet_address: artist.wallet_address,
        verified: artist.verified || false,
      }}
      stats={{
        totalEarnings,
        trackCount: tracks?.length || 0,
        followerCount: followerCount || 0,
      }}
    />
  )
}
