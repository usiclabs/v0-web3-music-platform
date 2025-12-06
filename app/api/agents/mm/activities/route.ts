import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get recent activities
    const { data: activities, error } = await supabase
      .from("mm_agent_activity")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[API] Failed to get MM activities:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error("[API] Failed to get MM activities:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
