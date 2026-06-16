"use client"

import { Instagram, Twitter, Youtube, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SocialLink {
  platform: "instagram" | "twitter" | "youtube" | "website"
  url: string
  label: string
}

interface SocialLinksProps {
  links?: SocialLink[]
}

const defaultLinks: SocialLink[] = [
  { platform: "instagram", url: "#", label: "Instagram" },
  { platform: "twitter", url: "#", label: "Twitter" },
  { platform: "youtube", url: "#", label: "YouTube" },
  { platform: "website", url: "#", label: "Website" },
]

export function SocialLinks({ links = defaultLinks }: SocialLinksProps) {
  const getIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-5 w-5" />
      case "twitter":
        return <Twitter className="h-5 w-5" />
      case "youtube":
        return <Youtube className="h-5 w-5" />
      case "website":
        return <Globe className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div className="px-6 mb-6">
      <h3 className="text-sm font-bold text-white mb-4 tracking-wider">CONNECT</h3>
      <div className="flex gap-3">
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-300"
            title={link.label}
          >
            <div className="text-gray-400 hover:text-red-400 transition-colors">{getIcon(link.platform)}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
