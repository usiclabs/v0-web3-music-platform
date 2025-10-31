import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">Last updated: January 2025</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 md:p-12 space-y-10">
          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-lg">
              MyUSIC is a decentralized music platform built on blockchain technology. We collect minimal information to
              provide our services:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-3 ml-4 text-lg">
              <li>Wallet addresses (public blockchain data)</li>
              <li>Profile information you choose to provide (artist name, bio, avatar)</li>
              <li>Usage data (tracks played, uploads, interactions)</li>
              <li>Technical data (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-lg">We use collected information to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-3 ml-4 text-lg">
              <li>Provide and improve our music streaming and creation services</li>
              <li>Process payments and track earnings for artists</li>
              <li>Facilitate royalty splits and on-chain transactions</li>
              <li>Communicate with you about platform updates and features</li>
              <li>Prevent fraud, abuse, and unauthorized access</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">3. Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Profile data and track metadata are stored securely in our database. All payment transactions, royalty
              splits, and token mints are recorded on the Base blockchain and are publicly visible. Audio files are
              stored in decentralized storage systems to ensure availability and censorship resistance.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-lg">
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-3 ml-4 text-lg">
              <li>Service providers who help operate the platform (hosting, storage, analytics)</li>
              <li>Law enforcement when required by law or to protect our rights</li>
              <li>Other users (public profile information, artist names, and published content only)</li>
              <li>Blockchain networks (transaction data is public by design)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">5. Blockchain Transparency</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              All transactions on MyUSIC are recorded on the Base blockchain. This includes payments, royalty splits,
              token swaps, and NFT mints. Blockchain data is public, permanent, and cannot be deleted. Your wallet
              address and transaction history are visible to anyone on the blockchain explorer.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-lg">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-3 ml-4 text-lg">
              <li>Access your personal data stored on our platform</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated off-chain data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Object to certain data processing activities</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 text-lg">
              Note: Blockchain data cannot be deleted due to the immutable nature of blockchain technology.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              We use cookies and similar technologies to improve your experience, analyze usage patterns, and remember
              your preferences. You can control cookies through your browser settings. Disabling cookies may limit some
              platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              We implement industry-standard security measures to protect your data, including encryption, secure
              servers, and regular security audits. However, no system is completely secure. You are responsible for
              securing your wallet, private keys, and seed phrases. Never share your private keys with anyone, including
              MyUSIC team members.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              MyUSIC is not intended for users under 13 years old. We do not knowingly collect data from children. If
              you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">10. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              MyUSIC operates globally. Your data may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">11. Changes to Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              We may update this policy from time to time to reflect changes in our practices or legal requirements. We
              will notify you of significant changes via email or platform notification. Continued use of MyUSIC after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-lg">
              For privacy questions, to exercise your rights, or to report concerns, contact us at:
            </p>
            <div className="bg-background/50 p-6 rounded-lg border border-border/50">
              <p className="text-foreground font-medium text-lg">Email: privacy@myusic.xyz</p>
              <p className="text-foreground font-medium text-lg">Website: https://myusic.xyz</p>
            </div>
          </section>
        </Card>
      </main>
    </div>
  )
}
