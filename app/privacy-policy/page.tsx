import { Card } from "@/components/ui/card"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: February 2, 2025</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to USIC ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our decentralized music streaming platform at myusic.xyz (the
              "Platform"). Please read this policy carefully. By using the Platform, you agree to the collection and use
              of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">2.1 Blockchain Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  As a Web3 platform, we interact with public blockchain data:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Wallet addresses (public keys)</li>
                  <li>Transaction hashes and blockchain interactions</li>
                  <li>Token balances and holdings</li>
                  <li>Smart contract interactions</li>
                  <li>On-chain activity history</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Note: All blockchain data is publicly accessible and permanently recorded on the Base blockchain.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">2.2 Profile Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  When you create an artist profile, we collect:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Artist name and bio</li>
                  <li>Profile images and avatars</li>
                  <li>Social media links (TikTok, X/Twitter, Farcaster, Zora)</li>
                  <li>Music uploads and metadata</li>
                  <li>Profile token information (if tokenized)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">2.3 Usage Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  We automatically collect certain information when you use the Platform:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Play counts and streaming history</li>
                  <li>Search queries and browsing behavior</li>
                  <li>Device information and browser type</li>
                  <li>IP address and geographic location</li>
                  <li>Referral sources and navigation paths</li>
                  <li>Performance and error logs</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">2.4 Payment Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All payments are processed on-chain via smart contracts. We do not collect or store traditional
                  payment information (credit cards, bank accounts). Payment data is recorded on the blockchain and
                  includes transaction amounts, timestamps, and wallet addresses.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Providing and maintaining Platform functionality</li>
              <li>Processing streaming payments via X402 protocol</li>
              <li>Facilitating token swaps through Uniswap V4</li>
              <li>Verifying token holdings for token-gated content</li>
              <li>Displaying artist profiles and music catalogs</li>
              <li>Calculating and distributing royalties</li>
              <li>Analyzing usage patterns to improve the Platform</li>
              <li>Detecting and preventing fraud or abuse</li>
              <li>Communicating updates and important notices</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Blockchain Transparency</h2>
            <p className="text-muted-foreground leading-relaxed">
              USIC operates on public blockchain infrastructure (Base). This means that certain information is
              inherently public and cannot be made private:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>All wallet addresses are publicly visible</li>
              <li>Transaction history is permanently recorded on-chain</li>
              <li>Token holdings and balances are publicly accessible</li>
              <li>Smart contract interactions are transparent and auditable</li>
              <li>Profile tokenization events are recorded on the blockchain</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By using USIC, you acknowledge and accept the public nature of blockchain technology.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Storage and Security</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">5.1 Storage Methods</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Profile data is stored in Supabase (PostgreSQL database)</li>
                  <li>Music files are stored on decentralized storage (Livepeer)</li>
                  <li>Transaction data is stored on Base blockchain</li>
                  <li>Metadata is stored both on-chain and in our database</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">5.2 Security Measures</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  We implement industry-standard security measures:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Encrypted data transmission (HTTPS/TLS)</li>
                  <li>Secure database access controls</li>
                  <li>Regular security audits and updates</li>
                  <li>Smart contract security best practices</li>
                  <li>Rate limiting and DDoS protection</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  However, no method of transmission over the internet is 100% secure. You are responsible for
                  maintaining the security of your wallet and private keys.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              USIC integrates with the following third-party services:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>WalletConnect:</strong> For wallet connection and authentication
              </li>
              <li>
                <strong>Base Blockchain:</strong> For transaction processing and smart contracts
              </li>
              <li>
                <strong>Uniswap V4:</strong> For decentralized token swaps
              </li>
              <li>
                <strong>Clanker:</strong> For profile token deployment
              </li>
              <li>
                <strong>Livepeer:</strong> For decentralized media storage and streaming
              </li>
              <li>
                <strong>DexScreener:</strong> For token price and market cap data
              </li>
              <li>
                <strong>Supabase:</strong> For database and authentication services
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Maintain user sessions and preferences</li>
              <li>Remember wallet connections</li>
              <li>Analyze Platform usage and performance</li>
              <li>Improve user experience</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that disabling cookies may limit Platform
              functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Public Blockchain:</strong> Transaction data is publicly visible on Base blockchain
              </li>
              <li>
                <strong>Service Providers:</strong> With third-party services necessary for Platform operation
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly authorize sharing
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Your Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Access:</strong> Request access to your personal data
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your data (subject to blockchain limitations)
              </li>
              <li>
                <strong>Portability:</strong> Request a copy of your data in a portable format
              </li>
              <li>
                <strong>Objection:</strong> Object to certain data processing activities
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Note: Blockchain data cannot be deleted or modified once recorded on-chain. We can only remove off-chain
              data from our databases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              USIC is not intended for users under the age of 18. We do not knowingly collect personal information from
              children. If you believe we have collected information from a child, please contact us immediately at
              privacy@myusic.xyz, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              USIC operates globally and may transfer data across international borders. By using the Platform, you
              consent to the transfer of your information to countries that may have different data protection laws than
              your jurisdiction. We take appropriate measures to ensure your data is protected in accordance with this
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as necessary to provide Platform services and comply with legal
              obligations. Off-chain data may be deleted upon request, but blockchain data is permanent and cannot be
              removed. Inactive accounts may be archived or deleted after extended periods of inactivity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
              "Last updated" date. We encourage you to review this policy periodically. Continued use of the Platform
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please
              contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Email: privacy@myusic.xyz
              <br />
              Website: myusic.xyz
              <br />
              Legal: legal@myusic.xyz
            </p>
          </section>

          <section className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              By using USIC, you acknowledge that you have read, understood, and agree to this Privacy Policy. If you do
              not agree with this policy, you must not access or use the Platform.
            </p>
          </section>
        </Card>
      </main>
    </div>
  )
}
