"use client"

import { Share2, Copy, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface HeroCardProps {
  name: string
  avatar: string
  walletAddress: string
  bio: string
  verified?: boolean
}

export function HeroCard({ name, avatar, walletAddress, bio, verified }: HeroCardProps) {
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "0x0000...0000"
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const handleCopyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: name,
        text: `Check out ${name} on MyUSIC`,
        url: window.location.href,
      })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6">
      {avatar && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${avatar})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/85" />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-5">
          <Badge className="bg-white/10 text-white border-white/20 text-xs font-medium">
            <span className="text-red-400 mr-1">#1</span> ARTIST
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Artist info */}
        <div className="flex gap-4 mb-5">
          <Avatar className="h-16 w-16 border-2 border-white/20 flex-shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-red-500/20 text-red-400 text-lg font-bold">
              {name?.[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-white truncate">{name}</h1>
              {verified && <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-400 mb-2">Independent Artist</p>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio ? (
          <p className="text-sm text-gray-300 mb-5 leading-relaxed line-clamp-2">{bio}</p>
        ) : null}

        {/* Actions row */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopyAddress}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
          >
            <Copy className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-mono text-gray-400">{shortAddress}</span>
            {copied && <span className="text-xs text-emerald-400 ml-1">Copied!</span>}
          </button>

          <Button
            className={
              isFollowing
                ? "bg-white/10 text-white border border-white/20 hover:bg-white/20 font-semibold"
                : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30 font-semibold"
            }
            onClick={() => setIsFollowing(!isFollowing)}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </div>
    </div>
  )
}
