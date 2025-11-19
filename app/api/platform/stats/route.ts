import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    
    // Get total tracks created
    const { count: tracksCount } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })

    // Get unique artists (profiles with at least one track)
    const { data: artistsData } = await supabase
      .from('profiles')
      .select('wallet_address')
      .in('wallet_address', 
        supabase
          .from('tracks')
          .select('artist_id')
      )

    const uniqueArtists = artistsData?.length || 0

    return NextResponse.json({
      tracksCreated: tracksCount || 0,
      artists: uniqueArtists,
      maxDuration: 8, // Static value - Suno v5 max duration
    })
  } catch (error) {
    console.error('[v0] Error fetching platform stats:', error)
    // Return fallback data on error
    return NextResponse.json({
      tracksCreated: 0,
      artists: 0,
      maxDuration: 8,
    })
  }
}
