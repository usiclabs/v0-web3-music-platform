"use client"

import { Button } from "@/components/ui/button"
import { Twitter, Send, MessageCircle, Share2, Copy, Check } from 'lucide-react'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/lib/web3/wallet-context"

interface SocialShareButtonsProps {
  type: "track" | "playlist" | "profile" | "achievement"
  id: string
  title: string
  description?: string
  referralCode?: string
  className?: string
}

export default function SocialShareButtons({
  type,
  id,
  title,
  description,
  referralCode,
  className = "",
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const { address } = useWallet()

  const shareUrl = `${window.location.origin}/${type}/${id}${referralCode ? `?ref=${referralCode}` : ""}`

  const getShareText = () => {
    switch (type) {
      case "track":
        return `🎵 Check out "${title}" on USI - The Web3 music streaming platform where artists earn instantly!`
      case "playlist":
        return `🎧 Listen to my "${title}" playlist on USI - Discover amazing music and support artists directly!`
      case "profile":
        return `🎤 Follow ${title} on USI - The future of music streaming powered by Web3!`
      case "achievement":
        return `🏆 I just unlocked "${title}" on USI! Join me and earn rewards for discovering great music!`
      default:
        return `Check out ${title} on USI!`
    }
  }

  const shareText = getShareText()

  const logShareEvent = async (platform: string) => {
    if (!address) return

    try {
      await fetch("/api/referrals/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_address: address,
          share_type: type,
          shared_id: id,
          platform,
          referral_code: referralCode,
        }),
      })
    } catch (error) {
      console.error("Failed to log share event:", error)
    }
  }

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "width=550,height=420")
    logShareEvent("twitter")
  }

  const shareOnFarcaster = () => {
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "width=550,height=420")
    logShareEvent("farcaster")
  }

  const shareOnTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    window.open(url, "_blank", "width=550,height=420")
    logShareEvent("telegram")
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
      logShareEvent("native")
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        })
        logShareEvent("native")
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={shareOnTwitter} className="gap-2">
        <Twitter className="h-4 w-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      <Button variant="outline" size="sm" onClick={shareOnFarcaster} className="gap-2">
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Farcaster</span>
      </Button>

      <Button variant="outline" size="sm" onClick={shareOnTelegram} className="gap-2">
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Telegram</span>
      </Button>

      <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </Button>

      {navigator.share && (
        <Button variant="outline" size="sm" onClick={nativeShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">More</span>
        </Button>
      )}
    </div>
  )
}
