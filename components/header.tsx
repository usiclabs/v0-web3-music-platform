"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/web3/wallet-context"
import { Wallet, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { MobileMenu } from "@/components/mobile-menu"
import { useState } from "react"

export function Header() {
  const { address, isConnected, connect, disconnect } = useWallet()
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-black/80 backdrop-blur-ultra supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group p-2">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Image src="/images/usic-logo.png" alt="USIC Logo" fill className="object-contain" priority />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {[
            { href: "/discover", label: "Discover" },
            { href: "/trending", label: "Trending" },
            { href: "/explore", label: "Explore" },
            { href: "/live", label: "Live" },
            { href: "/artists", label: "Artists" },
            { href: "/dashboard", label: "Dashboard" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-all duration-300 relative group ${
                isActive(item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 ${
                  isActive(item.href) ? "w-full shadow-[0_0_10px_rgba(229,62,62,0.5)]" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-10 w-10 rounded-full hover:bg-white/10 hover:scale-110 transition-all duration-300"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {isConnected && address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20 hover:scale-105 hover-glow-intense transition-all duration-300 text-sm h-10 px-4 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <Wallet className="h-4 w-4 text-primary relative z-10" />
                  <span className="font-mono relative z-10">{formatAddress(address)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/95 backdrop-blur-ultra border border-primary/20 animate-scale-in"
              >
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => disconnect()}
                  className="cursor-pointer text-destructive hover:bg-destructive/10"
                >
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 hover:scale-105 hover-glow-intense transition-all duration-300 shadow-lg shadow-primary/25 text-sm h-10 px-4 text-white relative overflow-hidden group"
              onClick={connect}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <Wallet className="h-4 w-4 relative z-10" />
              <span className="hidden xs:inline relative z-10">Connect</span>
            </Button>
          )}

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
