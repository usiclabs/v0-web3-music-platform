import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArtistProfilePremium } from "@/components/artist-profile-premium"

export default async function ArtistPage({ params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const normalizedAddress = address.toLowerCase()
    const supabase = await createClient()

    // Fetch artist profile
    const { data: artist, error: artistError } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .maybeSingle()

    if (artistError) {
      console.error("[v0] Error fetching artist:", artistError.message)
      notFound()
    }

    if (!artist) {
      notFound()
    }

    // Fetch follower count with error handling
    const { count: followerCount, error: followError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_address", normalizedAddress)

    if (followError) {
      console.warn("[v0] Error fetching followers:", followError.message)
    }

    // Fetch artist's tracks with full data
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id, title, cover_url, duration, price_per_chunk, created_at")
      .eq("artist_id", normalizedAddress)
      .or("is_hidden.is.null,is_hidden.eq.false")
      .order("created_at", { ascending: false })
      .limit(20)

    if (tracksError) {
      console.warn("[v0] Error fetching tracks:", tracksError.message)
    }

    const trackCount = tracks?.length || 0

    // Fetch total earnings from artist_payments table (not streams)
    // This is the source of truth for artist earnings
    let totalEarnings = 0

    const { data: artistPayments, error: paymentsError } = await supabase
      .from("artist_payments")
      .select("total_earned")
      .eq("artist_id", normalizedAddress)

    if (paymentsError) {
      console.warn("[v0] Error fetching artist payments:", paymentsError.message)
    }

    if (artistPayments && artistPayments.length > 0) {
      totalEarnings = artistPayments.reduce((sum, payment) => {
        const earned = Number.parseFloat(payment.total_earned || "0")
        return sum + (Number.isFinite(earned) ? earned : 0)
      }, 0)
    }

    // Sanitize artist bio to prevent XSS
    const sanitizeBio = (bio: string | null): string => {
      if (!bio) return ""
      return bio
        .substring(0, 280) // Max 280 chars
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .trim()
    }

    // Truncate name if too long
    const truncateName = (name: string | null): string => {
      if (!name) return "Artist"
      return name.length > 50 ? name.substring(0, 47) + "..." : name
    }

    return (
      <ArtistProfilePremium
        artist={{
          artist_name: truncateName(artist.artist_name),
          avatar_url: artist.avatar_url || "",
          bio: sanitizeBio(artist.bio),
          wallet_address: artist.wallet_address,
          verified: artist.verified || false,
        }}
        stats={{
          totalEarnings: Number.isFinite(totalEarnings) ? totalEarnings : 0,
          trackCount,
          followerCount: followerCount || 0,
        }}
        tracks={tracks || []}
      />
    )
  } catch (error) {
    console.error("[v0] Artist page error:", error)
    notFound()
  }
}
