"use client"

import { Music2, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatCardProps {
  icon: "tracks" | "followers"
  value: number
  label: string
  description: string
}

export function StatCard({ icon, value, label, description }: StatCardProps) {
  const Icon = icon === "tracks" ? Music2 : Users

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6 flex flex-col">
      {/* Icon Container */}
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/30 to-red-900/30 border border-red-500/20 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-red-400" />
      </div>

      {/* Value */}
      <div className="mb-4 flex-1">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <h3 className="text-xs font-bold text-gray-400 tracking-wider mb-2">{label}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      {/* Arrow Button */}
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 self-start mt-auto">
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
