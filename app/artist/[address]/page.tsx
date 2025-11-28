import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArtistPageClient } from "@/components/artist-page-client"

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

  let profileTokenMarketCap: string | null = null
  if ((artist as any).profile_token_address) {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${(artist as any).profile_token_address}`,
        { next: { revalidate: 60 } },
      )
      if (response.ok) {
        const data = await response.json()
        if (data.pairs && data.pairs.length > 0) {
          const marketCap = Number.parseFloat(data.pairs[0].marketCap || "0")
          if (marketCap >= 1000000) {
            profileTokenMarketCap = `$${(marketCap / 1000000).toFixed(2)}M`
          } else if (marketCap >= 1000) {
            profileTokenMarketCap = `$${(marketCap / 1000).toFixed(2)}K`
          } else {
            profileTokenMarketCap = `$${marketCap.toFixed(2)}`
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile token market cap:", error)
    }
  }

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_address", normalizedAddress)

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_address", normalizedAddress)

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
  let totalPlays = 0

  if (trackIds.length > 0) {
    const { data: trackStreams } = await supabase
      .from("streams")
      .select("total_paid, chunks_played")
      .in("track_id", trackIds)

    if (trackStreams) {
      totalEarnings = trackStreams.reduce((sum, stream) => sum + Number(stream.total_paid || 0), 0)
      totalPlays = trackStreams.reduce((sum, stream) => sum + Number(stream.chunks_played || 0), 0)
    }
  }

  const { data: streams } = await supabase
    .from("streams")
    .select(`
      *,
      tracks:tracks!inner(
        *,
        artist:profiles!tracks_artist_id_fkey(*)
      )
    `)
    .eq("listener_address", normalizedAddress)
    .order("last_played_at", { ascending: false })
    .limit(50)

  const { data: liveStreams } = await supabase
    .from("live_streams")
    .select("*")
    .eq("artist_address", normalizedAddress)
    .order("created_at", { ascending: false })
    .limit(10)

  const isCurrentlyLive = liveStreams?.some((stream) => stream.is_live) || false

  const { data: followersData } = await supabase
    .from("follows")
    .select("follower_address, created_at")
    .eq("following_address", normalizedAddress)
    .order("created_at", { ascending: false })

  let followers: any[] = []
  if (followersData && followersData.length > 0) {
    const followerAddresses = followersData.map((f) => f.follower_address)
    const { data: followerProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("wallet_address", followerAddresses)

    const profileMap = new Map(followerProfiles?.map((p) => [p.wallet_address, p]) || [])
    followers = followersData.map((f) => ({
      ...f,
      follower: profileMap.get(f.follower_address) || {
        wallet_address: f.follower_address,
        artist_name: null,
        avatar_url: null,
      },
    }))
  }

  const { data: followingData } = await supabase
    .from("follows")
    .select("following_address, created_at")
    .eq("follower_address", normalizedAddress)
    .order("created_at", { ascending: false })

  let following: any[] = []
  if (followingData && followingData.length > 0) {
    const followingAddresses = followingData.map((f) => f.following_address)
    const { data: followingProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("wallet_address", followingAddresses)

    const profileMap = new Map(followingProfiles?.map((p) => [p.wallet_address, p]) || [])
    following = followingData.map((f) => ({
      ...f,
      following: profileMap.get(f.following_address) || {
        wallet_address: f.following_address,
        artist_name: null,
        avatar_url: null,
      },
    }))
  }

  // Fetch artist's AI tracks
  const { data: aiTracks } = await supabase
    .from("tracks")
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(*)
    `)
    .eq("artist_id", normalizedAddress)
    .eq("ai_generated", true)
    .or("is_hidden.is.null,is_hidden.eq.false")
    .order("created_at", { ascending: false })

  return (
    <ArtistPageClient
      artist={artist}
      address={address}
      followerCount={followerCount || 0}
      followingCount={followingCount || 0}
      tracks={tracks || []}
      totalEarnings={totalEarnings}
      totalPlays={totalPlays}
      profileTokenMarketCap={profileTokenMarketCap}
      streams={streams || []}
      liveStreams={liveStreams || []}
      isCurrentlyLive={isCurrentlyLive}
      followers={followers}
      following={following}
      aiTracks={aiTracks || []}
    />
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
