"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, User, TrendingUp, Users, Activity } from "lucide-react"

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  const navItems = [
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/artists", icon: Users, label: "Artists" },
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    { href: "/analytics", icon: Activity, label: "Activity" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* iOS-style blurred background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl border-t border-white/10" />

      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 ease-out active:scale-95"
              style={{ willChange: "transform" }}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ease-out ${
                  active
                    ? "bg-accent/20 text-accent scale-110"
                    : "text-muted-foreground hover:text-foreground hover:scale-105"
                }`}
                style={{ willChange: active ? "transform, background-color" : "auto" }}
              >
                <Icon
                  className={`h-5 w-5 transition-all duration-300 ${
                    active ? "scale-110 drop-shadow-[0_0_8px_rgba(229,62,62,0.6)]" : ""
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-all duration-300 ${
                  active ? "text-accent drop-shadow-[0_0_4px_rgba(229,62,62,0.4)]" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
