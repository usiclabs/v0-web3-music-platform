import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Web3Provider } from "@/lib/web3/providers"
import { AudioPlayerProvider } from "@/lib/audio-player-context"
import { AudioPlayer } from "@/components/audio-player"
import { X402PaymentModal } from "@/components/x402-payment-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { BlockchainTicker } from "@/components/blockchain-ticker"
import { OnboardingModal } from "@/components/onboarding-modal"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { PresenceTracker } from "@/components/presence-tracker"
import { PageTransition } from "@/components/page-transition"
import { ErrorBoundary } from "@/components/error-boundary"
import { IOSInstallPrompt } from "@/components/ios-install-prompt"
import { FarcasterProvider } from "@/lib/farcaster-provider"
import { FarcasterBadge } from "@/components/farcaster-badge"
import { EarningsToastListener } from "@/components/earnings-toast-listener"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MyUSIC - Web3 Music Streaming",
  description: "Blockchain-powered music streaming with micropayments and NFTs",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyUSIC",
  },
  themeColor: "#0a0a0a",
  openGraph: {
    title: "MyUSIC - Web3 Music Streaming",
    description: "Blockchain-powered music streaming with micropayments and NFTs",
    url: "https://myusic.xyz",
    siteName: "MyUSIC",
    images: [
      {
        url: "https://myusic.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyUSIC - Web3 Music Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyUSIC - Web3 Music Streaming",
    description: "Blockchain-powered music streaming with micropayments and NFTs",
    images: ["https://myusic.xyz/og-image.png"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://myusic.xyz/og-image.png",
    "fc:frame:button:1": "Open MyUSIC",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://myusic.xyz",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MyUSIC" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ErrorBoundary>
          <FarcasterProvider>
            <Web3Provider>
              <AudioPlayerProvider>
                <Header />
                <BlockchainTicker />
                <FarcasterBadge />
                <PageTransition>{children}</PageTransition>
                <AudioPlayer />
                <X402PaymentModal />
                <MobileBottomNav />
                <OnboardingModal />
                <RealtimeNotifications />
                <PresenceTracker />
                <IOSInstallPrompt />
                <EarningsToastListener />
                <Toaster />
              </AudioPlayerProvider>
            </Web3Provider>
          </FarcasterProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
