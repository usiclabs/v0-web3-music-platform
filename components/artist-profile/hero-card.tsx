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
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-6 mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6">
        {/* Background Image with Dark Overlay */}
        {avatar && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${avatar})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

        {/* Content */}
        <div className="relative z-10">
          {/* Top Row: Badge and Share Button */}
          <div className="flex items-start justify-between mb-4">
            <Badge className="bg-white/10 text-white border-white/20 text-xs font-medium">
              <span className="text-red-400 mr-1">#1</span> ARTIST
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
                onClick={() => {
                  navigator.share?.({
                    title: name,
                    text: `Check out ${name} on mymusic.xyz`,
                    url: window.location.href,
                  })
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Artist Info Row */}
          <div className="flex gap-4 mb-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 border-2 border-white/20 flex-shrink-0">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-red-500/20 text-red-400 text-lg font-bold">
                {name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name and Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">{name}</h1>
                {verified && <CheckCircle2 className="h-5 w-5 text-red-500" />}
              </div>
              <p className="text-xs text-gray-400 mb-2">Verified Artist</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-500">Active now</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-2">{bio}</p>
          )}

          {/* Wallet Address and Follow Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Wallet Address Pill */}
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all group flex-1 sm:flex-none"
            >
              <Copy className="h-3 w-3 text-gray-400 group-hover:text-gray-300" />
              <span className="text-xs font-mono text-gray-400 group-hover:text-gray-300">{shortAddress}</span>
              {copied && <span className="text-xs text-emerald-400">Copied!</span>}
            </button>

            {/* Follow Button */}
            <Button
              className={`gap-2 font-semibold transition-all ${
                isFollowing
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                  : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30"
              }`}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
                <h2 className="text-2xl font-bold text-white">{name || "Artist"}</h2>
                {verified && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">✓</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span className="font-mono">{shortAddress}</span>
                <Copy className="h-3 w-3 cursor-pointer hover:text-gray-300" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{bio}</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-2 pt-4 border-t border-white/10">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10">
              <Youtube className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10">
              <Music2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
