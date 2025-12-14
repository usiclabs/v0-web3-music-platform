"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Star, Activity, Code, Globe, Calendar, TrendingUp, MessageSquare, Zap } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"

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

export default function AgentDetailClient({ agent }: { agent: AgentDetails }) {
  const { address: userAddress } = useAccount()
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  if (!userAddress) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="p-12 text-center border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">{agent.name}</h2>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">{agent.description}</p>

          <div className="flex gap-3 justify-center mb-8">
            <Badge variant="outline">{agent.version}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {agent.average_rating > 0 ? agent.average_rating.toFixed(1) : "New"}
            </Badge>
          </div>

          <p className="text-muted-foreground mb-6">
            Connect your wallet to interact with this agent and submit feedback.
          </p>

          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </Link>
            <Link href="/agents">
              <Button variant="outline" className="w-full bg-transparent">
                View All Agents
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  async function submitFeedback() {
    if (!userAddress || !comment.trim()) return

    setSubmittingFeedback(true)
    try {
      const response = await fetch("/api/agents/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentAddress: agent.agent_address,
          rating,
          comment: comment.trim(),
          userAddress,
        }),
      })

      if (response.ok) {
        setComment("")
        setRating(5)
        // Note: In a real app, you'd use SWR or similar to refetch
      }
    } catch (error) {
      console.error("[v0] Error submitting feedback:", error)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <Card className="p-8 mb-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Bot className="h-12 w-12 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{agent.name}</h1>
              <Badge variant="outline">{agent.version}</Badge>
            </div>
            <p className="text-lg text-muted-foreground mb-4">{agent.description}</p>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-semibold">
                  {agent.average_rating > 0 ? agent.average_rating.toFixed(1) : "New"}
                </span>
                <span className="text-muted-foreground">({agent.feedback_count} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-5 w-5" />
                <span>{agent.total_actions.toLocaleString()} actions</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Capabilities */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Capabilities</h3>
          </div>
          <div className="space-y-2">
            {agent.capabilities.map((cap, i) => (
              <Badge key={i} variant="secondary" className="mr-2 mb-2">
                {cap}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Endpoints */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Endpoints</h3>
          </div>
          <div className="space-y-2 text-sm">
            {agent.api_endpoint ? (
              <div>
                <span className="text-muted-foreground">API:</span>
                <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">{agent.api_endpoint}</code>
              </div>
            ) : (
              <p className="text-muted-foreground">No API endpoint</p>
            )}
            {agent.websocket_endpoint && (
              <div>
                <span className="text-muted-foreground">WebSocket:</span>
                <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">{agent.websocket_endpoint}</code>
              </div>
            )}
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Registered:</span>
              <span className="ml-2">{new Date(agent.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Owner:</span>
              <code className="ml-2 text-xs">{agent.owner_address.slice(0, 10)}...</code>
            </div>
          </div>
        </Card>
      </div>

      {/* Playlists Created */}
      {agent.playlists.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Playlists Created
          </h3>
          <div className="space-y-3">
            {agent.playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                <Card className="p-4 hover:bg-muted/50 transition-colors">
                  <h4 className="font-semibold mb-1">{playlist.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{playlist.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback Section */}
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Community Feedback
        </h3>

        {/* Submit Feedback */}
        <Card className="p-4 mb-6 bg-muted/50">
          <h4 className="font-semibold mb-3">Submit Your Feedback</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this agent..."
                rows={3}
              />
            </div>
            <Button onClick={submitFeedback} disabled={submittingFeedback || !comment.trim()}>
              {submittingFeedback ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </Card>

        {/* Feedback List */}
        <div className="space-y-4">
          {agent.feedback.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No feedback yet. Be the first to review!</p>
          ) : (
            agent.feedback.map((fb) => (
              <Card key={fb.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={fb.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{fb.profiles?.artist_name?.slice(0, 2).toUpperCase() || "??"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{fb.profiles?.artist_name || "Anonymous"}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= fb.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{fb.comment}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
