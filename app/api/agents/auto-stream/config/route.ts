import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ownerAddress = searchParams.get("ownerAddress")

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: agent, error } = await supabase
      .from("auto_stream_agents")
      .select("*")
      .eq("owner_address", ownerAddress)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent: agent || null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const supabase = await createClient()
    const { data: agent, error } = await supabase
      .from("auto_stream_agents")
      .update(updates)
      .eq("id", id)
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
