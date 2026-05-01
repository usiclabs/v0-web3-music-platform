"use client"

import { useState, useEffect } from "react"
import { useAccount, useSwitchChain } from "wagmi"
import { base, baseSepolia, mainnet, arbitrum } from "wagmi/chains"
import { monad, unichain } from "@/lib/web3/config"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check, Zap } from "lucide-react"

const MAINNET_CHAINS = [
  {
    chain: base,
    icon: "🔵",
    color: "text-blue-500",
    description: "Coinbase L2",
  },
  {
    chain: mainnet,
    icon: "⟠",
    color: "text-gray-400",
    description: "Ethereum L1",
  },
  {
    chain: arbitrum,
    icon: "🔷",
    color: "text-blue-400",
    description: "Arbitrum L2",
  },
  {
    chain: unichain,
    icon: "🦄",
    color: "text-pink-500",
    description: "Uniswap L2",
  },
  {
    chain: monad,
    icon: "🟣",
    color: "text-purple-500",
    description: "10,000 TPS",
  },
]

const TESTNET_CHAINS = [
  {
    chain: baseSepolia,
    icon: "🟡",
    color: "text-yellow-500",
    description: "Base Testnet",
  },
]

export function ChainSwitcher() {
  const { chain } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const allChains = [...MAINNET_CHAINS, ...TESTNET_CHAINS]
  const currentChain = allChains.find((c) => c.chain.id === chain?.id) || MAINNET_CHAINS[0]

  // Return placeholder during SSR to prevent hydration mismatch
  if (!isHydrated) {
    return <div className="h-8 sm:h-10 w-20 sm:w-32" />
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background/50 backdrop-blur-sm border-border/50"
          disabled={isPending}
        >
          <span>{currentChain.icon}</span>
          <span className="hidden sm:inline">{currentChain.chain.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Mainnets</DropdownMenuLabel>
        {MAINNET_CHAINS.map(({ chain: c, icon, color, description }) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => {
              switchChain?.({ chainId: c.id })
              setIsOpen(false)
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <div className="flex flex-col">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {c.id === monad.id && <Zap className="h-3 w-3 text-purple-500" />}
                  {description}
                </span>
              </div>
            </div>
            {chain?.id === c.id && <Check className={`h-4 w-4 ${color}`} />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Testnets</DropdownMenuLabel>
        {TESTNET_CHAINS.map(({ chain: c, icon, color, description }) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => {
              switchChain?.({ chainId: c.id })
              setIsOpen(false)
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <div className="flex flex-col">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </div>
            {chain?.id === c.id && <Check className={`h-4 w-4 ${color}`} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
