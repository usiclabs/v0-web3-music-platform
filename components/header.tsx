"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/web3/wallet-context"
import { Wallet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileWalletModal } from "@/components/mobile-wallet-modal"
import { useConnect } from "wagmi"
import { connectViaWalletConnect } from "@/lib/web3/wallet-utils"
import { NotificationCenter } from "@/components/notification-center"
import { ChainSwitcher } from "@/components/web3/chain-switcher"
import { useEffect, useState } from "react"

export function Header() {
  const { address, isConnected, disconnect, showMobileWalletModal, setShowMobileWalletModal } = useWallet()
  const pathname = usePathname()
  const { connectAsync, connectors } = useConnect()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  const handleWalletConnectSelection = async () => {
    try {
      await connectViaWalletConnect(connectors, connectAsync)
    } catch (error) {
      console.error("[v0] Failed to connect via WalletConnect:", error)
    }
  }

  const handleConnectClick = () => {
    if (!isHydrated) return

    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    const hasInjectedWallet = window.ethereum

    // On desktop with browser wallet, connect directly via injected provider
    if (!isMobile && hasInjectedWallet) {
      console.log("[v0] Desktop with injected wallet detected, connecting directly...")
      const injectedConnector = connectors.find((c) => c.type === "injected")
      if (injectedConnector) {
        connectAsync({ connector: injectedConnector, chainId: 8453 }).catch((error) => {
          console.error("[v0] Failed to connect:", error)
        })
      }
    } else {
      // On mobile or no injected wallet, show the modal
      setShowMobileWalletModal(true)
    }
  }

  const displayName = address ? formatAddress(address) : ""

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group p-1 sm:p-2">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 transition-all group-hover:scale-110">
              <Image src="/images/usic-logo.png" alt="USIC Logo" fill className="object-contain" priority />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/explore"
              className={`text-sm font-medium transition-all relative group ${
                isActive("/explore") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Explore
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                  isActive("/explore") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
            <Link
              href="/artists"
              className={`text-sm font-medium transition-all relative group ${
                isActive("/artists") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Artists
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                  isActive("/artists") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
            <Link
              href="/swap"
              className={`text-sm font-medium transition-all relative group ${
                isActive("/swap") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Swap
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                  isActive("/swap") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
            <Link
              href="/live"
              className={`text-sm font-medium transition-all relative group ${
                isActive("/live") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Live
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                  isActive("/live") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
            <Link
              href="/analytics"
              className={`text-sm font-medium transition-all relative group ${
                isActive("/analytics") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                  isActive("/analytics") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-all relative group ${
                isActive("/dashboard") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                  isActive("/dashboard") ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationCenter />

            {isConnected && isHydrated && <ChainSwitcher />}

            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 sm:gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20 hover:scale-105 transition-all text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-3"
                  >
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="font-mono">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card/95 backdrop-blur-2xl border border-border/70 animate-scale-in"
                >
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-destructive">
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 sm:gap-2 bg-accent hover:bg-accent/90 hover:scale-105 transition-all shadow-lg shadow-accent/25 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4 text-white"
                onClick={handleConnectClick}
                disabled={!isHydrated}
              >
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Connect</span>
                <span className="xs:hidden">Connect</span>
              </Button>
            )}

            <MobileMenu />
          </div>
        </div>
      </header>

      <MobileWalletModal
        open={showMobileWalletModal}
        onOpenChange={setShowMobileWalletModal}
        onSelectWalletConnect={handleWalletConnectSelection}
      />
    </>
  )
}
