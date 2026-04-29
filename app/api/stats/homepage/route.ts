import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    const { count: trackCount, error: trackError } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })

    if (trackError) throw trackError

    const { data: artistData, error: artistError } = await supabase
      .from("tracks")
      .select("artist_id")
      .not("artist_id", "is", null)

    if (artistError) throw artistError

    // Get unique artist count
    const uniqueArtists = new Set(artistData?.map((t) => t.artist_id) || [])
    const artistCount = uniqueArtists.size

    const { data: streamData, error: streamError } = await supabase.from("streams").select("total_paid")

    if (streamError) throw streamError

    // Calculate total paid out
    const totalPaidOut =
      streamData?.reduce((sum, stream) => {
        return sum + (Number.parseFloat(stream.total_paid?.toString() || "0") || 0)
      }, 0) || 0

    const formatNumber = (num: number): string => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`
      return `${num}+`
    }

    const formatCurrency = (num: number): string => {
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
      if (num >= 1) return `$${num.toFixed(0)}`
      return `$${num.toFixed(2)}`
    }

    return NextResponse.json({
      tracks: {
        value: formatNumber(trackCount || 0),
        raw: trackCount || 0,
      },
      artists: {
        value: formatNumber(artistCount),
        raw: artistCount,
      },
      paidOut: {
        value: formatCurrency(totalPaidOut),
        raw: totalPaidOut,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching homepage stats:", error)
    return NextResponse.json(
      {
        tracks: { value: "0+", raw: 0 },
        artists: { value: "0+", raw: 0 },
        paidOut: { value: "$0+", raw: 0 },
      },
      { status: 500 },
    )
  }
}
