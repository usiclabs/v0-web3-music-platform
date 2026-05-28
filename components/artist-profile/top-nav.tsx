"use client"

import { Menu, Bell, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface TopNavProps {
  walletAddress: string
}

export function TopNav({ walletAddress }: TopNavProps) {
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-3">
      <div className="flex items-center justify-between max-w-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg">
            ♪
          </div>
        </div>

        {/* Center Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Chain/Network Selector */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-gray-300">Base</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Wallet Pill */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-gray-200">{shortAddress}</span>
            <Copy className="h-3 w-3 text-gray-400 cursor-pointer" />
          </div>

          {/* Menu */}
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
