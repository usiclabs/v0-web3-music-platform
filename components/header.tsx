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

  useEffect(() => {
    // This useEffect can be removed - header should always be visible
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  const handleWalletConnectSelection = async () => {
    try {
      await connectViaWalletConnect(connectors, connectAsync)
    } catch (error) {
      console.error("Failed to connect via WalletConnect:", error)
    }
  }

  const handleConnectClick = () => {
    const isMobile = typeof window !== "undefined" && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    const hasInjectedWallet = typeof window !== "undefined" && window.ethereum

    if (!isMobile && hasInjectedWallet) {
      const injectedConnector = connectors.find((c) => c.type === "injected")
      if (injectedConnector) {
        connectAsync({ connector: injectedConnector, chainId: 8453 }).catch((error) => {
          console.error("Failed to connect:", error)
        })
      }
    } else {
      setShowMobileWalletModal(true)
    }
  }

  const displayName = address ? formatAddress(address) : ""

  const navItems = [
    { href: "/explore", label: "Explore" },
    { href: "/artists", label: "Artists" },
    { href: "/swap", label: "Swap" },
    { href: "/live", label: "Live" },
    { href: "/analytics", label: "Activity" },
    { href: "/dashboard", label: "Dashboard" },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out bg-black/70 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]`}
      >
        <div className="container flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Image src="/images/usic-logo.png" alt="USIC Logo" fill className="object-contain" priority />
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors duration-200 ${
                  isActive(item.href)
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationCenter />

            {isConnected && <ChainSwitcher />}

            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 h-9 px-4"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A]" />
                    <span className="font-mono text-sm">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#0A0A0A] border border-white/10 rounded-xl"
                >
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5">
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5">
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-[#FF2A2A] hover:bg-[#FF2A2A]/10">
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="h-9 px-4"
                onClick={handleConnectClick}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect
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
