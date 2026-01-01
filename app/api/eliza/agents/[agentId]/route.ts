import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const supabase = await createClient()

    const { data: agent, error } = await supabase.from("eliza_agents").select("*").eq("id", agentId).single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params
    const updates = await req.json()
    const supabase = await createClient()

    const { data: agent, error } = await supabase
      .from("eliza_agents")
      .update(updates)
      .eq("id", agentId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
