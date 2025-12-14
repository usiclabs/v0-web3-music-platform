import { notFound } from "next/navigation"
import AgentDetailClient from "@/components/agent-detail-client"

interface AgentDetails {
  id: string
  agent_address: string
  name: string
  description: string
  version: string
  capabilities: string[]
  api_endpoint: string | null
  websocket_endpoint: string | null
  owner_address: string
  total_actions: number
  created_at: string
  feedback_count: number
  average_rating: number
  feedback: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
    user_address: string
    profiles: {
      artist_name: string
      avatar_url: string
    } | null
  }>
  playlists: Array<{
    id: string
    name: string
    description: string
    created_at: string
    playlist_tracks: Array<{ count: number }>
  }>
}

export default async function AgentDetailPage({ params }: { params: { address: string } }) {
  const { address: agentAddress } = params

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agents/${agentAddress}`,
      {
        cache: "revalidate",
        next: { revalidate: 60 },
      },
    )

    if (!response.ok) {
      notFound()
    }

    const data = await response.json()
    const agent: AgentDetails = data.agent

    return <AgentDetailClient agent={agent} />
  } catch (error) {
    console.error("[v0] Error loading agent:", error)
    notFound()
  }
}
