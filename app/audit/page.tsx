import { Button } from "@/components/ui/button"
import { Shield, CheckCircle2, FileText, ExternalLink, Download } from "lucide-react"

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Smart Contract Audit</h1>
          <p className="text-xl text-muted-foreground">Security and transparency are our top priorities</p>
        </div>

        {/* Security Overview */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Audited & Secure</h2>
                <p className="text-muted-foreground">All smart contracts undergo rigorous security audits</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              USI's smart contracts have been audited by leading blockchain security firms to ensure the safety of user
              funds and the integrity of our payment protocols. We maintain the highest standards of security and
              transparency in all our on-chain operations.
            </p>
          </div>
        </section>

        {/* Audit Reports */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-3xl font-bold mb-6">Audit Reports</h2>
          <div className="space-y-4">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">X402 Payment Protocol Audit</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Comprehensive security audit of the X402 micropayment protocol
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary">Completed</span>
                    <span className="px-3 py-1 rounded-full bg-card">January 2025</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">$USI Token Contract Audit</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Security review of the $USI token smart contract and staking mechanisms
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary">Completed</span>
                    <span className="px-3 py-1 rounded-full bg-card">December 2024</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">NFT Minting Contract Audit</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Audit of music NFT minting and royalty distribution contracts
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary">Completed</span>
                    <span className="px-3 py-1 rounded-full bg-card">November 2024</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Security Practices */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-3xl font-bold mb-6">Security Practices</h2>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Multi-Signature Wallets</h3>
                  <p className="text-muted-foreground">
                    All protocol upgrades require multiple signatures from trusted parties
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Continuous Monitoring</h3>
                  <p className="text-muted-foreground">
                    24/7 monitoring of all smart contracts for suspicious activity
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Bug Bounty Program</h3>
                  <p className="text-muted-foreground">Rewards for security researchers who identify vulnerabilities</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Open Source</h3>
                  <p className="text-muted-foreground">
                    All smart contract code is publicly available for community review
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* View on Block Explorer */}
        <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">View Smart Contracts</h2>
            <p className="text-muted-foreground mb-6">
              All our smart contracts are verified and publicly viewable on BaseScan
            </p>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              View on BaseScan
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
