import { Card } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using USI, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              USI is a decentralized music streaming platform. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Maintaining the security of your wallet and private keys</li>
              <li>All transactions made through your wallet</li>
              <li>Ensuring you have the rights to any content you upload</li>
              <li>Complying with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Content Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Artists retain full ownership of their music. By uploading content to USI, you grant us a non-exclusive
              license to distribute and stream your content on the platform. You represent that you have all necessary
              rights to the content you upload.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Payments and Fees</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed on-chain using USDC. USI charges a small platform fee on each transaction.
              Artists are responsible for any applicable taxes on their earnings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You may not:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Upload content you don't have rights to</li>
              <li>Manipulate play counts or engagement metrics</li>
              <li>Use the platform for illegal activities</li>
              <li>Attempt to exploit or hack the platform</li>
              <li>Harass or abuse other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              USI is provided "as is" without warranties of any kind. We are not responsible for losses due to smart
              contract bugs, blockchain issues, or user error. Cryptocurrency transactions are irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the platform after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please contact us at legal@anti.music
            </p>
          </section>
        </Card>
      </main>
    </div>
  )
}
