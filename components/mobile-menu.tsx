"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { X, Menu, BarChart3, Coins, ArrowLeftRight, Upload, DollarSign, Settings, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/web3/wallet-context"
import Image from "next/image"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { address, isConnected, connect } = useWallet()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  const handleNavigation = (href: string) => {
    setIsClosing(true)

    // Wait for menu close animation before navigating
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      router.push(href)
    }, 300)
  }

  const menuItems = [
    { href: "/discover", icon: BarChart3, label: "Discover", color: "text-blue-400", pulseColor: "bg-blue-400" },
    { href: "/live", icon: Radio, label: "Live", color: "text-red-400", pulseColor: "bg-red-400" },
    { href: "/analytics", icon: BarChart3, label: "Analytics", color: "text-purple-400", pulseColor: "bg-purple-400" },
    { href: "/staking", icon: Coins, label: "Staking", color: "text-yellow-400", pulseColor: "bg-yellow-400" },
    { href: "/swap", icon: ArrowLeftRight, label: "Swap", color: "text-cyan-400", pulseColor: "bg-cyan-400" },
    { href: "/dashboard/upload", icon: Upload, label: "Upload", color: "text-green-400", pulseColor: "bg-green-400" },
    {
      href: "/dashboard/earnings",
      icon: DollarSign,
      label: "Earnings",
      color: "text-emerald-400",
      pulseColor: "bg-emerald-400",
    },
  ]

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Full Screen Overlay Menu */}
      {isOpen && (
        <div
          className={`md:hidden fixed inset-0 z-[100] h-screen flex flex-col transition-all duration-300 ${
            isClosing ? "animate-out fade-out slide-out-to-right" : "animate-in fade-in slide-in-from-right"
          }`}
        >
          {/* Backdrop with blur - covers entire screen */}
          <div
            className={`absolute inset-0 bg-black/90 backdrop-blur-2xl transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={() => {
              setIsClosing(true)
              setTimeout(() => {
                setIsOpen(false)
                setIsClosing(false)
              }, 300)
            }}
          />

          {/* Menu content container - positioned relative to sit above backdrop */}
          <div
            className={`relative flex flex-col h-screen w-full transition-transform duration-300 ${
              isClosing ? "translate-x-full" : "translate-x-0"
            }`}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center gap-2 transition-transform hover:scale-110 active:scale-95"
              >
                <div className="relative h-10 w-10">
                  <Image src="/images/usic-logo.png" alt="USIC Logo" fill className="object-contain" />
                </div>
              </button>

              <button
                onClick={() => {
                  setIsClosing(true)
                  setTimeout(() => {
                    setIsOpen(false)
                    setIsClosing(false)
                  }, 300)
                }}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-xl pb-32">
              <div className="py-6 px-4 space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                        active
                          ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: isClosing ? "none" : "slide-in-right 0.3s ease-out forwards",
                      }}
                    >
                      <div className="relative">
                        <Icon
                          className={`h-6 w-6 ${active ? item.color : "text-muted-foreground"} transition-colors duration-300`}
                        />
                        {active && (
                          <>
                            {/* Pulsing dot indicator */}
                            <span
                              className={`absolute -top-1 -right-1 h-2 w-2 ${item.pulseColor} rounded-full animate-pulse`}
                            />
                            {/* Glow effect */}
                            <span
                              className={`absolute inset-0 ${item.pulseColor} opacity-20 blur-xl rounded-full animate-pulse`}
                            />
                          </>
                        )}
                      </div>
                      <span className="text-base font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-white/10 p-4 bg-black/80 backdrop-blur-xl absolute bottom-20 left-0 right-0">
              <button
                onClick={() => handleNavigation("/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <Settings className="h-5 w-5" />
                <span className="text-base font-medium">Settings</span>
              </button>

              <div className="mt-3">
                {isConnected && address ? (
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 transition-all hover:scale-[1.02] active:scale-95 text-white h-10 font-mono"
                  >
                    {`${address.slice(0, 6)}...${address.slice(-4)}`}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-accent hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/25 text-white h-10 px-4"
                    onClick={() => {
                      connect()
                      setIsClosing(true)
                      setTimeout(() => {
                        setIsOpen(false)
                        setIsClosing(false)
                      }, 300)
                    }}
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
