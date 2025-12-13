import { type NextRequest, NextResponse } from "next/server"
import { AutonomousArtistAgentService } from "@/lib/agents/autonomous-artist-agent"

export async function POST(request: NextRequest) {
  try {
    const { ownerAddress } = await request.json()

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const agent = await AutonomousArtistAgentService.getOrCreateByOwner(ownerAddress)

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error("[API] Failed to create autonomous artist agent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
