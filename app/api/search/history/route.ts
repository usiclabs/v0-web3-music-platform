import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json([])
    }

    const { data } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_address", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query, result_type } = await request.json()

    await supabase.from("search_history").insert({
      user_address: user.id,
      query,
      result_type,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = createServerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await supabase.from("search_history").delete().eq("user_address", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
