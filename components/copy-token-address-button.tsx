"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface CopyTokenAddressButtonProps {
  address: string
}

export function CopyTokenAddressButton({ address }: CopyTokenAddressButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="flex-1 h-8 text-xs border-green-500/30 hover:bg-green-500/10 bg-transparent"
      onClick={handleCopy}
    >
      <Copy className="h-3 w-3 mr-1" />
      {copied ? "Copied!" : "Copy CA"}
    </Button>
  )
}
