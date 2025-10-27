"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Menu, BarChart3, Coins, ArrowLeftRight, Upload, DollarSign, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/web3/wallet-context"
import Image from "next/image"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { address, isConnected, connect } = useWallet()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  // Pages that are NOT in the bottom nav bar
  const menuItems = [
    { href: "/discover", icon: BarChart3, label: "Discover" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/staking", icon: Coins, label: "Staking" },
    { href: "/swap", icon: ArrowLeftRight, label: "Swap" },
    { href: "/dashboard/upload", icon: Upload, label: "Upload" },
    { href: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
  ]

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Full Screen Overlay Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[100] h-screen flex flex-col animate-in fade-in duration-200">
          {/* Backdrop with blur - covers entire screen */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsOpen(false)} />

          {/* Menu content container - positioned relative to sit above backdrop */}
          <div className="relative flex flex-col h-screen w-full">
            {/* Header - fixed height */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10 bg-background/95">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <div className="relative h-10 w-10">
                  <Image src="/images/usic-logo.png" alt="USIC Logo" fill className="object-contain" />
                </div>
              </Link>

              <div className="flex items-center gap-2">
                {!isConnected && (
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:opacity-90 transition-all text-white"
                    onClick={() => {
                      connect()
                      setIsOpen(false)
                    }}
                  >
                    Connect Wallet
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain bg-background/95 pb-32">
              <div className="py-6 px-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF5252]/20 border border-[#FF6B6B]/30 text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-base font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-white/10 p-4 bg-background/95 absolute bottom-20 left-0 right-0">
              <div className="flex items-center gap-4">
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">Settings</span>
                </Link>
              </div>

              {isConnected && address && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:opacity-90 transition-all text-white"
                  >
                    {`${address.slice(0, 6)}...${address.slice(-4)}`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
