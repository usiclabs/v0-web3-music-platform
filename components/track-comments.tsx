"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send, Trash2, Reply } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_address: string
  parent_id: string | null
  profiles: {
    artist_name: string | null
    avatar_url: string | null
  } | null
  replies?: Comment[]
}

interface TrackCommentsProps {
  trackId: string
}

export function TrackComments({ trackId }: TrackCommentsProps) {
  const { address, isConnected, connect } = useWallet()
  const { toast } = useToast()
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: commentsData,
    mutate,
    isLoading,
  } = useSWR<{ comments: Comment[] }>(`/api/tracks/${trackId}/comments`, async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch comments")
    return res.json()
  })

  const comments = commentsData?.comments || []

  const handleSubmitComment = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to comment",
      })
      connect()
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please write something before posting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tracks/${trackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          userAddress: address,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to post comment")
      }

      toast({
        title: "Comment Posted",
        description: "Your comment has been added",
      })

      setNewComment("")
      mutate()
    } catch (error: any) {
      toast({
        title: "Failed to Post",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to reply",
      })
      connect()
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please write something before posting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tracks/${trackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          userAddress: address,
          parentId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to post reply")
      }

      toast({
        title: "Reply Posted",
        description: "Your reply has been added",
      })

      setReplyContent("")
      setReplyTo(null)
      mutate()
    } catch (error: any) {
      toast({
        title: "Failed to Post",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!address) return

    try {
      const res = await fetch(`/api/comments/${commentId}?userAddress=${address}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete comment")
      }

      toast({
        title: "Comment Deleted",
        description: "Your comment has been removed",
      })

      mutate()
    } catch (error: any) {
      toast({
        title: "Failed to Delete",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Comments</h2>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {/* New Comment Form */}
      <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50">
        <Textarea
          placeholder={isConnected ? "Share your thoughts..." : "Connect wallet to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!isConnected || isSubmitting}
          className="mb-3 min-h-[100px] bg-background/50"
          maxLength={1000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{newComment.length}/1000</span>
          <Button onClick={handleSubmitComment} disabled={!isConnected || isSubmitting || !newComment.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Loading comments...</p>
          </Card>
        ) : comments.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No comments yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4 bg-card/50 backdrop-blur-xl border-border/50">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {comment.profiles?.artist_name?.[0]?.toUpperCase() ||
                      comment.user_address.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/artist/${comment.user_address}`}
                      className="font-semibold text-sm hover:text-primary transition-colors"
                    >
                      {comment.profiles?.artist_name || formatAddress(comment.user_address)}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap break-words">{comment.content}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="h-7 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    {address?.toLowerCase() === comment.user_address.toLowerCase() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyTo === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-primary/30">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        disabled={isSubmitting}
                        className="mb-2 min-h-[80px] bg-background/50"
                        maxLength={1000}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={isSubmitting || !replyContent.trim()}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-border/30">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {reply.profiles?.artist_name?.[0]?.toUpperCase() ||
                                reply.user_address.slice(2, 4).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/artist/${reply.user_address}`}
                                className="font-semibold text-xs hover:text-primary transition-colors"
                              >
                                {reply.profiles?.artist_name || formatAddress(reply.user_address)}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                              {reply.content}
                            </p>
                            {address?.toLowerCase() === reply.user_address.toLowerCase() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(reply.id)}
                                className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 mt-1"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
