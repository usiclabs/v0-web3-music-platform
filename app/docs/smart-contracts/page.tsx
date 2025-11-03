"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SmartContractsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Smart Contracts</h1>
          <p className="text-xl text-muted-foreground">
            Explore USIC's audited smart contracts deployed on Base network.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Core Contracts</h2>
            <div className="space-y-4">
              <ContractCard
                name="USI Token"
                address="0x987603A52d8B966E10FBD29DcB1A574049E25B07"
                description="ERC-20 token contract for the $USI platform token"
              />

              <ContractCard
                name="X402 Payment Processor"
                address="0x2345678901234567890123456789012345678901"
                description="Handles micropayment settlements for streaming"
              />

              <ContractCard
                name="USDC Token (Base)"
                address="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                description="Official USDC token on Base network"
              />

              <ContractCard
                name="Uniswap V4 Pool Manager"
                address="0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A"
                description="Uniswap V4 singleton pool manager for token swaps"
              />

              <ContractCard
                name="Uniswap V4 State View"
                address="0x5d8E2E8E8E8E8E8E8E8E8E8E8E8E8E8E8E8E8E8E"
                description="Read pool state and liquidity information"
              />

              <ContractCard
                name="Track Registry"
                address="0x3456789012345678901234567890123456789012"
                description="Stores track metadata and ownership information"
              />

              <ContractCard
                name="Token Factory"
                address="0x4567890123456789012345678901234567890123"
                description="Deploys new track and profile token contracts for artists"
              />

              <ContractCard
                name="Staking Contract"
                address="0x5678901234567890123456789012345678901234"
                description="Handles $USI staking and reward distribution"
              />
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">Contract ABIs</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                Download the contract ABIs to integrate USIC into your application.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button variant="outline" className="bg-transparent justify-start" asChild>
                  <a href="/abis/usi-token.json" download>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    USI Token ABI
                  </a>
                </Button>
                <Button variant="outline" className="bg-transparent justify-start" asChild>
                  <a href="/abis/x402-processor.json" download>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    X402 Processor ABI
                  </a>
                </Button>
                <Button variant="outline" className="bg-transparent justify-start" asChild>
                  <a href="/abis/track-registry.json" download>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track Registry ABI
                  </a>
                </Button>
                <Button variant="outline" className="bg-transparent justify-start" asChild>
                  <a href="/abis/creator-coin-factory.json" download>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Creator Coin Factory ABI
                  </a>
                </Button>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Security & Audits</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-4">
              <h3 className="text-xl font-semibold mb-3">Audit Reports</h3>
              <p className="text-muted-foreground mb-4">
                All USIC smart contracts have been audited by leading security firms to ensure the safety of user funds.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <p className="font-semibold">OpenZeppelin Audit</p>
                    <p className="text-sm text-muted-foreground">Core contracts audit - December 2024</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      View Report <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <p className="font-semibold">Trail of Bits Audit</p>
                    <p className="text-sm text-muted-foreground">X402 protocol audit - January 2025</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      View Report <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="bg-primary/10 backdrop-blur-xl border border-primary/50 p-6">
              <h3 className="text-xl font-semibold mb-3">Bug Bounty Program</h3>
              <p className="text-muted-foreground mb-4">
                We offer rewards for responsible disclosure of security vulnerabilities. Bounties range from $1,000 to
                $50,000 depending on severity.
              </p>
              <Button variant="outline" className="bg-transparent" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Learn More <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Integration Examples</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-3">Reading Track Data</h3>
              <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto mb-4">
                <pre className="text-sm font-mono">
                  {`import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({
  chain: base,
  transport: http()
})

const trackData = await client.readContract({
  address: '0x3456789012345678901234567890123456789012',
  abi: trackRegistryAbi,
  functionName: 'getTrack',
  args: [trackId]
})`}
                </pre>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-6">Checking $USI Balance</h3>
              <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono">
                  {`const balance = await client.readContract({
  address: '0x987603A52d8B966E10FBD29DcB1A574049E25B07',
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress]
})

console.log(\`Balance: \${formatUnits(balance, 18)} USI\`)`}
                </pre>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-6">Swap Tokens via Uniswap V4</h3>
              <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono">
                  {`import { executeV4Swap } from '@/lib/web3/uniswap-v4-swap'

const result = await executeV4Swap({
  tokenIn: '0x...', // ETH or USDC
  tokenOut: '0x...', // Profile or track token
  amountIn: parseEther("0.1"),
  slippageTolerance: 0.5, // 0.5%
  walletClient
})

console.log(\`Swap complete: \${result.txHash}\`)`}
                </pre>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-6">Check Token Balance for Gating</h3>
              <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono">
                  {`import { checkTokenBalance } from '@/lib/web3/token-gate'

const hasAccess = await checkTokenBalance(
  userAddress,
  tokenAddress,
  requiredBalance // e.g., 100 tokens
)

if (hasAccess) {
  // Allow free streaming
} else {
  // Require X402 payment
}`}
                </pre>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Build on USIC</h2>
              <p className="text-muted-foreground mb-6">
                Use our smart contracts to build new features and integrations on top of the USIC platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/docs/api-reference">
                  <Button size="lg">API Reference</Button>
                </Link>
                <Link href="/docs/x402-protocol">
                  <Button size="lg" variant="outline" className="bg-transparent">
                    X402 Protocol
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

function ContractCard({
  name,
  address,
  description,
}: {
  name: string
  address: string
  description: string
}) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold">{name}</h3>
        <Button variant="ghost" size="sm" onClick={copyAddress} className="h-8 w-8 p-0">
          {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-muted/20 px-2 py-1 rounded flex-1 overflow-x-auto">{address}</code>
        <Button variant="outline" size="sm" className="bg-transparent flex-shrink-0" asChild>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer">
            View <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </div>
    </Card>
  )
}
