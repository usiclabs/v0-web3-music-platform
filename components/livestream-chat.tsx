"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Comment {
  id: string
  stream_id: string
  user_address: string
  content: string
  created_at: string
}

interface LivestreamChatProps {
  streamId: string
}

export function LivestreamChat({ streamId }: LivestreamChatProps) {
  const { address } = useWallet()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] LivestreamChat mounted with streamId:", streamId)
    console.log("[v0] Current wallet address:", address)
  }, [streamId, address])

  // Load initial comments
  useEffect(() => {
    async function loadComments() {
      console.log("[v0] Loading comments for stream:", streamId)
      try {
        const { data, error } = await supabase
          .from("livestream_comments")
          .select("*")
          .eq("stream_id", streamId)
          .order("created_at", { ascending: true })
          .limit(100)

        if (error) {
          console.error("[v0] Error loading comments:", error)
          throw error
        }

        console.log("[v0] Loaded comments:", data?.length || 0)
        setComments(data || [])
      } catch (error) {
        console.error("[v0] Error loading comments:", error)
      } finally {
        setLoading(false)
      }
    }

    if (streamId) {
      loadComments()
    } else {
      console.warn("[v0] No streamId provided to LivestreamChat")
      setLoading(false)
    }
  }, [streamId, supabase])

  // Subscribe to real-time comments
  useEffect(() => {
    if (!streamId) {
      console.warn("[v0] Cannot subscribe to comments without streamId")
      return
    }

    console.log("[v0] Setting up real-time subscription for stream:", streamId)

    const channel = supabase
      .channel(`livestream:${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livestream_comments",
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          console.log("[v0] New comment received via real-time:", payload)
          setComments((prev) => [...prev, payload.new as Comment])
        },
      )
      .subscribe((status) => {
        console.log("[v0] Real-time subscription status:", status)
      })

    return () => {
      console.log("[v0] Cleaning up real-time subscription")
      supabase.removeChannel(channel)
    }
  }, [streamId, supabase])

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !address || sending) return

    console.log("[v0] Sending comment:", { streamId, address, content: newComment.trim() })
    setSending(true)
    try {
      const { data, error } = await supabase
        .from("livestream_comments")
        .insert({
          stream_id: streamId,
          user_address: address,
          content: newComment.trim(),
        })
        .select()

      if (error) {
        console.error("[v0] Error sending comment:", error)
        throw error
      }

      console.log("[v0] Comment sent successfully:", data)
      setNewComment("")
    } catch (error) {
      console.error("[v0] Error sending comment:", error)
      alert("Failed to send comment. Please try again.")
    } finally {
      setSending(false)
    }
  }

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold">Live Chat</h3>
        <p className="text-xs text-muted-foreground">{comments.length} messages</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">{comment.user_address.slice(2, 4).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{formatAddress(comment.user_address)}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1 break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border/50">
        {address ? (
          <form onSubmit={handleSendComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Send a message..."
              maxLength={500}
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sending || !newComment.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center">Connect wallet to chat</p>
        )}
      </div>
    </Card>
  )
}
