import { createServerClient } from "@/lib/supabase/server"
import { VideosFeed } from "@/components/videos-feed"
import type { Track } from "@/types/database"

interface VideoTrack extends Track {
  artist_name: string
  avatar_url: string | null
  view_count: number
  like_count: number
}

export default async function VideosPage() {
  const supabase = await createServerClient()

  const { data: tracksData } = await supabase
    .from("tracks")
    .select(
      `
      *,
      profiles!tracks_artist_id_fkey (
        artist_name,
        avatar_url
      )
    `,
    )
    .not("video_url", "is", null)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50)

  // Get view counts (streams) and like counts for each video
  const trackIds = tracksData?.map((t) => t.id) || []

  const { data: streamsData } = await supabase
    .from("streams")
    .select("track_id")
    .in("track_id", trackIds)

  const { data: likesData } = await supabase.from("likes").select("track_id").in("track_id", trackIds)

  // Aggregate counts
  const viewCounts = new Map<string, number>()
  streamsData?.forEach((stream) => {
    viewCounts.set(stream.track_id, (viewCounts.get(stream.track_id) || 0) + 1)
  })

  const likeCounts = new Map<string, number>()
  likesData?.forEach((like) => {
    likeCounts.set(like.track_id, (likeCounts.get(like.track_id) || 0) + 1)
  })

  const videos: VideoTrack[] =
    tracksData?.map((track) => ({
      ...track,
      artist_name: (track.profiles as any)?.artist_name || "Unknown Artist",
      avatar_url: (track.profiles as any)?.avatar_url || null,
      view_count: viewCounts.get(track.id) || 0,
      like_count: likeCounts.get(track.id) || 0,
    })) || []

  return <VideosFeed videos={videos} />
}
