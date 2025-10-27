// Database types for TypeScript
export interface Profile {
  wallet_address: string
  artist_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface Track {
  id: string
  title: string
  artist_id: string
  content_type: "audio" | "video"
  audio_url: string | null
  video_url: string | null
  cover_url: string | null
  thumbnail_url: string | null
  duration: number
  price_per_chunk: number
  unlock_type: "per_chunk" | "full_song"
  nft_contract_address: string | null
  token_id: string | null
  created_at: string
}

export interface RoyaltySplit {
  id: string
  track_id: string
  recipient_address: string
  share_percentage: number
  created_at: string
}

export interface Stream {
  id: string
  track_id: string
  listener_address: string
  chunks_played: number
  total_paid: number
  started_at: string
  last_played_at: string
}

// Extended types with relations
export interface TrackWithArtist extends Track {
  artist: Profile
}

export interface TrackWithRoyalties extends Track {
  royalty_splits: RoyaltySplit[]
}
