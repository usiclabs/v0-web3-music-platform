import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ANTI is a decentralized platform. We collect minimal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Wallet addresses (public blockchain data)</li>
              <li>Profile information you choose to provide (name, bio, avatar)</li>
              <li>Usage data (tracks played, uploads, interactions)</li>
              <li>Technical data (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We use collected information to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and improve our services</li>
              <li>Process payments and track earnings</li>
              <li>Communicate with you about the platform</li>
              <li>Prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Profile data and track metadata are stored in our database. All payment transactions are recorded on the
              Base blockchain and are publicly visible. Audio files are stored in decentralized storage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Service providers who help operate the platform</li>
              <li>Law enforcement when required by law</li>
              <li>Other users (public profile information only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Blockchain Transparency</h2>
            <p className="text-muted-foreground leading-relaxed">
              All transactions on ANTI are recorded on the Base blockchain. This includes payments, royalty splits, and
              NFT mints. Blockchain data is public and permanent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze usage, and remember your
              preferences. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data. However, no system is completely
              secure. You are responsible for securing your wallet and private keys.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              ANTI is not intended for users under 13 years old. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Changes to Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will notify you of significant changes via email or
              platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy questions or to exercise your rights, contact us at privacy@anti.music
            </p>
          </section>
        </Card>
      </main>
    </div>
  )
}
