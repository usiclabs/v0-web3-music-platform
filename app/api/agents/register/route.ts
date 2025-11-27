import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, api_endpoint, websocket_endpoint, capabilities } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    // Generate unique agent address
    const agentAddress = `0x${randomBytes(20).toString("hex")}`

    const { data, error } = await supabase
      .from("agents")
      .insert({
        agent_address: agentAddress,
        name,
        description,
        owner_address: session.user.id,
        api_endpoint: api_endpoint || null,
        websocket_endpoint: websocket_endpoint || null,
        capabilities: capabilities || [],
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to register agent:", error)
      return NextResponse.json({ error: "Failed to register agent" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Agent registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
