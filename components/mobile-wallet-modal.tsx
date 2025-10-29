"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet, ExternalLink, QrCode, Smartphone } from "lucide-react"

interface MobileWalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectWalletConnect: () => void
}

export function MobileWalletModal({ open, onOpenChange, onSelectWalletConnect }: MobileWalletModalProps) {
  const [showInstructions, setShowInstructions] = useState(false)

  const wallets = [
    {
      name: "WalletConnect",
      description: "Connect with any wallet",
      icon: QrCode,
      action: () => {
        onSelectWalletConnect()
        onOpenChange(false)
      },
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "MetaMask",
      description: "Open in MetaMask app",
      icon: Wallet,
      deepLink: `https://metamask.app.link/dapp/${typeof window !== "undefined" ? window.location.host : ""}`,
      gradient: "from-orange-500 to-amber-500",
    },
    {
      name: "Coinbase Wallet",
      description: "Open in Coinbase Wallet",
      icon: Wallet,
      deepLink: `https://go.cb-w.com/dapp?cb_url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`,
      gradient: "from-blue-600 to-blue-500",
    },
    {
      name: "Rainbow",
      description: "Open in Rainbow app",
      icon: Wallet,
      deepLink: `https://rnbwapp.com/open?url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Trust Wallet",
      description: "Open in Trust Wallet",
      icon: Wallet,
      deepLink: `https://link.trustwallet.com/open_url?coin_id=60&url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`,
      gradient: "from-blue-500 to-blue-600",
    },
  ]

  const handleWalletClick = (wallet: (typeof wallets)[0]) => {
    if (wallet.action) {
      wallet.action()
    } else if (wallet.deepLink) {
      window.location.href = wallet.deepLink
    }
  }

  if (showInstructions) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-muted/20 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Smartphone className="h-6 w-6 text-primary" />
              How to Connect on Mobile
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              To use this app on mobile Safari, you need to open it in a Web3 wallet browser:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Install a Web3 Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Download MetaMask, Coinbase Wallet, Rainbow, or Trust Wallet from the App Store
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Open the App</p>
                  <p className="text-sm text-muted-foreground">
                    Launch your wallet app and find the built-in browser (usually in the menu)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Visit This Site</p>
                  <p className="text-sm text-muted-foreground">
                    Navigate to {typeof window !== "undefined" ? window.location.host : "this site"} in the wallet
                    browser
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowInstructions(false)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Got It
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-muted/20 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wallet className="h-6 w-6 text-primary" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-2">
            Choose how you'd like to connect your wallet on mobile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {wallets.map((wallet) => {
            const Icon = wallet.icon
            return (
              <button
                key={wallet.name}
                onClick={() => handleWalletClick(wallet)}
                className="w-full group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${wallet.gradient} shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{wallet.name}</p>
                      {wallet.deepLink && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{wallet.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="border-t border-border/50 pt-4">
          <Button
            variant="ghost"
            onClick={() => setShowInstructions(true)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Need help? View instructions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
