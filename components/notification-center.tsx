"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Heart, MessageCircle, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "follow" | "like" | "comment" | "reply"
  sender_address: string
  track_id?: string
  comment_id?: string
  content?: string
  is_read: boolean
  created_at: string
  sender_name?: string
  track_title?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { address } = useWallet()
  const router = useRouter()
  const supabase = createClient()
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Load notifications
  useEffect(() => {
    if (!address || !isSupabaseConfigured) return

    const loadNotifications = async () => {
      console.log("[v0] Loading notifications for address:", address)

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_address", address)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("[v0] Error loading notifications:", error)
        return
      }

      console.log("[v0] Notifications loaded:", data?.length || 0, "notifications")

      if (data) {
        // Fetch sender names and track titles
        const enrichedNotifications = await Promise.all(
          data.map(async (notif) => {
            const [profileResult, trackResult] = await Promise.all([
              supabase.from("profiles").select("artist_name").eq("wallet_address", notif.sender_address).maybeSingle(),
              notif.track_id
                ? supabase.from("tracks").select("title").eq("id", notif.track_id).maybeSingle()
                : Promise.resolve({ data: null }),
            ])

            return {
              ...notif,
              sender_name: profileResult.data?.artist_name || formatAddress(notif.sender_address),
              track_title: trackResult.data?.title,
            }
          }),
        )

        setNotifications(enrichedNotifications)
        setUnreadCount(enrichedNotifications.filter((n) => !n.is_read).length)
        console.log("[v0] Unread count:", enrichedNotifications.filter((n) => !n.is_read).length)
      }
    }

    loadNotifications()

    // Subscribe to real-time updates
    console.log("[v0] Subscribing to notifications for:", address)
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_address=eq.${address}`,
        },
        (payload) => {
          console.log("[v0] New notification received via realtime:", payload)
          loadNotifications()
        },
      )
      .subscribe((status) => {
        console.log("[v0] Notification subscription status:", status)
      })

    return () => {
      console.log("[v0] Unsubscribing from notifications")
      supabase.removeChannel(channel)
    }
  }, [address, supabase, isSupabaseConfigured])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
      case "reply":
        return <MessageCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case "follow":
        return `${notif.sender_name} started following you`
      case "like":
        return `${notif.sender_name} liked your track${notif.track_title ? ` "${notif.track_title}"` : ""}`
      case "comment":
        return `${notif.sender_name} commented on your track${notif.track_title ? ` "${notif.track_title}"` : ""}`
      case "reply":
        return `${notif.sender_name} replied to your comment`
      default:
        return "New notification"
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id)

      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    // Navigate to relevant page
    if (notif.type === "follow") {
      router.push(`/artist/${notif.sender_address}`)
    } else if (notif.track_id) {
      router.push(`/track/${notif.track_id}`)
    }

    setIsOpen(false)
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    await supabase.from("notifications").update({ is_read: true }).eq("recipient_address", address).eq("is_read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const clearNotifications = async () => {
    await supabase.from("notifications").delete().eq("recipient_address", address)
    setNotifications([])
    setUnreadCount(0)
  }

  if (!address || !isSupabaseConfigured) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 sm:h-10 sm:w-10 hover:bg-accent/10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 bg-card/95 backdrop-blur-2xl border border-border/70 p-0"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs hover:bg-accent/10">
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="h-7 text-xs hover:bg-destructive/10 text-destructive"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4">
              <Empty className="border-0">
                <EmptyHeader>
                  <EmptyMedia>
                    <Bell className="h-12 w-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>No Notifications</EmptyTitle>
                  <EmptyDescription>You're all caught up! New notifications will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`px-4 py-3 cursor-pointer focus:bg-accent/10 ${!notif.is_read ? "bg-accent/5" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? "font-medium" : ""}`}>{getNotificationText(notif)}</p>
                      {notif.content && notif.type !== "follow" && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
