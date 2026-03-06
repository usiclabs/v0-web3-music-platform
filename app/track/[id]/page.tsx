import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { TrackDetailContent } from "@/components/track-detail-content"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Check for special routes FIRST before UUID validation
  if (id === "trending") {
    redirect("/trending")
  }

  if (!isValidUUID(id)) {
    // For other invalid IDs, show 404
    notFound()
  }

  const supabase = await createClient()

  // Fetch track with artist and royalty splits
  const { data: track } = await supabase
    .from("tracks")
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(*),
      royalty_splits(*)
    `)
    .eq("id", id)
    .single()

  if (!track) {
    notFound()
  }

  // Fetch stream stats
  const { data: stats } = await supabase.from("streams").select("chunks_played, total_paid").eq("track_id", id)

  const totalPlays = stats?.reduce((sum, s) => sum + s.chunks_played, 0) || 0
  const totalEarned = stats?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0

  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("track_id", id)

  const { data: streamData } = await supabase
    .from("streams")
    .select("*")
    .eq("track_id", id)
    .order("started_at", { ascending: false })

  const uniqueListeners = new Set(streamData?.map((s) => s.listener_address)).size
  const avgSegmentsPerStream =
    streamData && streamData.length > 0
      ? streamData.reduce((sum, s) => sum + s.chunks_played, 0) / streamData.length
      : 0
  const totalStreams = streamData?.length || 0
  const avgEarningsPerStream =
    totalStreams > 0 ? streamData!.reduce((sum, s) => sum + Number(s.total_paid), 0) / totalStreams : 0

  return (
    <TrackDetailContent
      track={track}
      likeCount={likeCount || 0}
      totalPlays={totalPlays}
      totalEarned={totalEarned}
      streamData={streamData || []}
      uniqueListeners={uniqueListeners}
      avgSegmentsPerStream={avgSegmentsPerStream}
      totalStreams={totalStreams}
      avgEarningsPerStream={avgEarningsPerStream}
    />
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
