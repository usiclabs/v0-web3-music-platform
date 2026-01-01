import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = await createClient()

    const { data: actions, error } = await supabase
      .from("eliza_actions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ actions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const { actionType, target, parameters } = await req.json()

    if (!actionType || !target) {
      return NextResponse.json({ error: "Action type and target required" }, { status: 400 })
    }

    const { ElizaAgentService } = await import("@/lib/eliza/core")
    const service = new ElizaAgentService(agentId)
    await service.initialize()

    const action = await service.executeAction(actionType, target, parameters || {})

    return NextResponse.json({ action })
  } catch (error: any) {
    console.error("[API] Failed to execute action:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
