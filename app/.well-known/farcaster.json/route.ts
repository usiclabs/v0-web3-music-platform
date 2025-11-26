import { NextResponse } from "next/server"

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || "",
      payload: process.env.FARCASTER_PAYLOAD || "",
      signature: process.env.FARCASTER_SIGNATURE || "",
    },
    baseBuilder: {
      allowedAddresses: [process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(",")[0] || ""],
    },
    frame: {
      version: "1",
      name: "MyUSIC",
      homeUrl: process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz",
      iconUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/icon-1024.png`,
      splashImageUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/splash-200.png`,
      splashBackgroundColor: "#0a0a0a",
      subtitle: "Web3 Music Streaming",
      description:
        "Blockchain-powered music streaming with micropayments, NFTs, and x402 payments. Stream music, create beats in the studio, and tokenize your tracks on Base.",
      tagline: "Music meets Web3",
      screenshotUrls: [
        `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/screenshot-1.png`,
        `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/screenshot-2.png`,
        `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/screenshot-3.png`,
      ],
      primaryCategory: "music",
      tags: ["music", "web3", "streaming", "nft", "studio"],
      heroImageUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/og-image.png`,
      ogTitle: "MyUSIC - Web3 Music Streaming",
      ogDescription:
        "Stream, create, and tokenize music on Base. Built with x402 micropayments and blockchain technology.",
      ogImageUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://myusic.xyz"}/og-image.png`,
      noindex: process.env.NODE_ENV !== "production",
      requiredChains: ["eip155:8453"],
    },
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
