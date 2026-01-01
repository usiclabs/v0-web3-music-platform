import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ownerAddress = searchParams.get("ownerAddress")

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: agents, error } = await supabase
      .from("eliza_agents")
      .select("*")
      .eq("owner_address", ownerAddress)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const { count: actionCount } = await supabase
          .from("eliza_actions")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agent.id)

        const { count: memoryCount } = await supabase
          .from("eliza_memory")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agent.id)

        return {
          ...agent,
          stats: {
            totalActions: actionCount || 0,
            memorySize: memoryCount || 0,
          },
        }
      }),
    )

    return NextResponse.json({ agents: agentsWithStats })
  } catch (error: any) {
    console.error("[API] Failed to list agents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
