"use client"

import { Compass, Users, TrendingUp, Activity, User, Leaf } from "lucide-react"
import Link from "next/link"

interface BottomNavProps {
  activeTab?: "explore" | "artists" | "trending" | "activity" | "profile"
}

export function BottomNav({ activeTab = "artists" }: BottomNavProps) {
  const navItems = [
    { id: "explore", label: "Explore", icon: Compass, href: "/explore" },
    { id: "artists", label: "Artists", icon: Users, href: "/artists" },
    { id: "trending", label: "Trending", icon: TrendingUp, href: "/trending" },
    { id: "activity", label: "Activity", icon: Activity, href: "/activity" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/10">
      <nav className="flex items-center justify-around px-4 h-20">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <Link key={item.id} href={item.href}>
              <div className="relative flex flex-col items-center justify-center py-2 px-4 cursor-pointer group">
                {/* Active indicator */}
                {isActive && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-1 w-8 rounded-full bg-red-500" />}

                {/* Icon */}
                <Icon
                  className={`h-6 w-6 transition-colors ${isActive ? "text-red-500" : "text-gray-400 group-hover:text-gray-300"}`}
                />

                {/* Label */}
                <span
                  className={`text-xs mt-1 font-medium transition-colors ${isActive ? "text-red-500" : "text-gray-400 group-hover:text-gray-300"}`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
