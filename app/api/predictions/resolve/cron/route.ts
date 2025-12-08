import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Cron job to auto-resolve markets that have passed their resolution date
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Find markets that need resolution
    const { data: marketsToResolve, error } = await supabase
      .from("prediction_markets")
      .select("id")
      .eq("is_active", true)
      .lte("resolution_date", new Date().toISOString())

    if (error) throw error

    const results = []

    // Resolve each market
    for (const market of marketsToResolve || []) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/predictions/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketId: market.id }),
        })

        const result = await response.json()
        results.push({ marketId: market.id, ...result })
      } catch (error) {
        console.error(`[v0] Failed to resolve market ${market.id}:`, error)
        results.push({ marketId: market.id, error: "Failed to resolve" })
      }
    }

    return NextResponse.json({
      success: true,
      resolved: results.length,
      results,
    })
  } catch (error) {
    console.error("[API] Error in resolution cron:", error)
    return NextResponse.json({ error: "Failed to run resolution cron" }, { status: 500 })
  }
}
