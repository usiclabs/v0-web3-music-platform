import { type NextRequest, NextResponse } from "next/server"
import { MusicStreamingAgentService } from "@/lib/agents/music-streaming-agent"

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const streamingAgent = new MusicStreamingAgentService(agentId)
    const result = await streamingAgent.startStreamingCycle()

    if (!result) {
      return NextResponse.json({ error: "Streaming cycle failed or agent inactive" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error("[API] Streaming cycle error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
