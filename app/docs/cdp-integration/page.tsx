import Link from "next/link"
import { ArrowLeft, Wallet, Zap, Users, Shield, Code, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CDPIntegrationPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Docs
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">CDP Integration</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Coinbase Developer Platform SDK for automated payouts and gasless transactions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Overview */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Overview</h2>
            <p className="text-muted-foreground">
              USIC integrates with Coinbase Developer Platform (CDP) SDK to provide enhanced blockchain operations
              including automated artist payouts, gasless transactions, and efficient batch operations on Base network.
            </p>
          </section>

          {/* Features */}
          <section>
            <h2 className="mb-6 text-2xl font-bold">Key Features</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
                <Wallet className="mb-4 h-8 w-8 text-accent" />
                <h3 className="mb-2 text-lg font-semibold">Automated Payouts</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically process artist earnings and send USDC payments in batches using server-side wallets.
                </p>
              </div>

              <div className="rounded-lg border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
                <Zap className="mb-4 h-8 w-8 text-accent" />
                <h3 className="mb-2 text-lg font-semibold">Gasless Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Sponsor transactions for users via Paymaster, eliminating gas fees for better UX.
                </p>
              </div>

              <div className="rounded-lg border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
                <Users className="mb-4 h-8 w-8 text-accent" />
                <h3 className="mb-2 text-lg font-semibold">Batch Operations</h3>
                <p className="text-sm text-muted-foreground">
                  Efficiently process multiple payouts in a single operation, reducing costs and complexity.
                </p>
              </div>

              <div className="rounded-lg border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
                <Shield className="mb-4 h-8 w-8 text-accent" />
                <h3 className="mb-2 text-lg font-semibold">Secure Wallet Management</h3>
                <p className="text-sm text-muted-foreground">
                  Server-side wallet with secure key management for automated operations.
                </p>
              </div>
            </div>
          </section>

          {/* Setup */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Setup</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold">1. Get CDP API Credentials</h3>
                <p className="mb-4 text-muted-foreground">
                  Visit the Coinbase Developer Platform portal to create a project and generate API credentials.
                </p>
                <a
                  href="https://portal.cdp.coinbase.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-accent hover:underline"
                >
                  Open CDP Portal
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold">2. Configure Environment Variables</h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <code className="text-sm">
                    CDP_API_KEY_NAME=your_api_key_name
                    <br />
                    CDP_API_KEY_PRIVATE_KEY=your_private_key
                    <br />
                    CDP_SERVER_WALLET_DATA={"{...}"}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold">3. Initialize Server Wallet</h3>
                <p className="mb-4 text-muted-foreground">
                  On first run, the system will create a server wallet. Copy the wallet data from logs and add it to
                  your environment variables.
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <code className="text-sm">curl -X POST /api/admin/payouts</code>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold">4. Fund Server Wallet</h3>
                <p className="text-muted-foreground">
                  Transfer USDC to the server wallet address to enable automated payouts.
                </p>
              </div>
            </div>
          </section>

          {/* API Endpoints */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">API Endpoints</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-500">POST</span>
                  <code className="text-sm">/api/admin/payouts</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Triggers artist payout processing. Should be called via cron job or admin panel.
                </p>
              </div>

              <div className="rounded-lg border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-500">GET</span>
                  <code className="text-sm">/api/admin/payouts</code>
                </div>
                <p className="text-sm text-muted-foreground">Returns CDP configuration status and readiness.</p>
              </div>
            </div>
          </section>

          {/* Code Examples */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Code Examples</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Process All Payouts</h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{`import { processArtistPayouts } from "@/lib/cdp/payouts"

const result = await processArtistPayouts()
// Returns: { success: 10, failed: 0, totalAmount: "1250.50" }`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold">Payout Single Artist</h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{`import { payoutArtist } from "@/lib/cdp/payouts"

const result = await payoutArtist("0x1234...")
console.log(\`Paid \${result.amount} USDC, tx: \${result.txHash}\`)`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold">Batch Send Tokens</h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{`import { batchSendTokens } from "@/lib/cdp/client"

const recipients = [
  { address: "0x1234...", amount: "100.50" },
  { address: "0x5678...", amount: "250.75" }
]

const txHashes = await batchSendTokens(recipients, "usdc")`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Resources */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Resources</h2>
            <div className="space-y-2">
              <a
                href="https://docs.cdp.coinbase.com/sdks/cdp-sdks-v2/typescript"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-accent hover:underline"
              >
                <Code className="mr-2 h-4 w-4" />
                CDP SDK Documentation
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
              <a
                href="https://portal.cdp.coinbase.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-accent hover:underline"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                CDP Portal
              </a>
              <a
                href="https://docs.base.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-accent hover:underline"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Base Network Documentation
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
