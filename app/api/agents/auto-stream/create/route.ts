import { type NextRequest, NextResponse } from "next/server"
import { AutoStreamAgentService } from "@/lib/agents/auto-stream-agent"

export async function POST(request: NextRequest) {
  try {
    const { ownerAddress } = await request.json()

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const agent = await AutoStreamAgentService.getOrCreateByOwner(ownerAddress)

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error("[API] Failed to create auto-stream agent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
