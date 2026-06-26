"use client"

import { Play, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface Track {
  id: string
  title: string
  cover_url?: string | null
  duration?: number | null
  price_per_chunk?: number | null
}

interface TracksGridProps {
  tracks: Track[]
  isLoading?: boolean
}

export function TracksGrid({ tracks, isLoading }: TracksGridProps) {
  if (isLoading) {
    return (
      <div className="px-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Latest Tracks</h3>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="px-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Latest Tracks</h3>
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No tracks yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Latest Tracks</h3>
        <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white">
          See All
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tracks.slice(0, 8).map((track) => (
          <div
            key={track.id}
            className="group rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 hover:border-red-500/40 transition-all duration-300"
          >
            {/* Cover Image */}
            <div className="relative aspect-square overflow-hidden bg-black">
              {track.cover_url ? (
                <Image
                  src={track.cover_url}
                  alt={track.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <Play className="h-8 w-8 text-gray-600" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                >
                  <Play className="h-5 w-5 fill-white" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Track Info */}
              <div className="p-3">
                <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                {track.duration ? (
                  <p className="text-xs text-gray-400 mt-1">{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}</p>
                ) : null}
                {track.price_per_chunk ? (
                  <p className="text-xs font-semibold text-red-400 mt-1">${Number(track.price_per_chunk).toFixed(4)}/chunk</p>
                ) : null}
              </div>
          </div>
        ))}
      </div>
    </div>
  )
}
