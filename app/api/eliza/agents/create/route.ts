import { type NextRequest, NextResponse } from "next/server"
import { createElizaAgent } from "@/lib/eliza/core"

export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, name, bio, personality, capabilities } = await req.json()

    if (!ownerAddress || !name) {
      return NextResponse.json({ error: "Owner address and name required" }, { status: 400 })
    }

    const agent = await createElizaAgent(ownerAddress, {
      name,
      bio: bio || "An autonomous music agent",
      personality: personality || ["creative", "analytical", "curious"],
      capabilities: capabilities || ["music_creation", "token_trading"],
    })

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error("[API] Failed to create Eliza agent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
