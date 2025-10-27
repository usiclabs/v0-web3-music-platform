import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Web3Provider } from "@/lib/web3/providers"
import { AudioPlayerProvider } from "@/lib/audio-player-context"
import { AudioPlayer } from "@/components/audio-player"
import { X402PaymentModal } from "@/components/x402-payment-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { ToastProvider } from "@/components/ui/toast"
import { Header } from "@/components/header"
import { BlockchainTicker } from "@/components/blockchain-ticker"
import { OnboardingModal } from "@/components/onboarding-modal"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "USI - Web3 Music Streaming",
  description: "Blockchain-powered music streaming with micropayments and NFTs",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.className} antialiased`}>
        <Web3Provider>
          <AudioPlayerProvider>
            <ToastProvider>
              <Header />
              <BlockchainTicker />
              {children}
              <AudioPlayer />
              <X402PaymentModal />
              <MobileBottomNav />
              <OnboardingModal />
              <RealtimeNotifications />
            </ToastProvider>
          </AudioPlayerProvider>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
