import { Card } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: February 2, 2025</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using USIC (the "Platform") at myusic.xyz, you accept and agree to be bound by these
              Terms of Service and all applicable laws and regulations. If you do not agree to these terms, you are
              prohibited from using or accessing this Platform. The materials contained in this Platform are protected
              by applicable copyright and trademark law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Platform Description</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              USIC is a decentralized Web3 music streaming platform built on Base blockchain that enables:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Music streaming with X402 micropayment protocol</li>
              <li>Track tokenization (ERC20 and NFT)</li>
              <li>Profile tokenization via Clanker integration</li>
              <li>Token-gated streaming for token holders</li>
              <li>Native Uniswap V4 token swaps</li>
              <li>On-chain royalty distribution</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              As a user of USIC, you are solely responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Maintaining the security of your Web3 wallet and private keys</li>
              <li>All transactions executed through your connected wallet</li>
              <li>Ensuring you have all necessary rights to content you upload</li>
              <li>Complying with all applicable local, state, national, and international laws</li>
              <li>Understanding the risks associated with cryptocurrency and blockchain technology</li>
              <li>Verifying all transaction details before confirmation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Content Rights and Licensing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Artists retain full ownership and copyright of their music. By uploading content to USIC, you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Grant USIC a non-exclusive, worldwide license to distribute and stream your content</li>
              <li>Represent and warrant that you own or have obtained all necessary rights to the content</li>
              <li>Acknowledge that you are solely responsible for any copyright infringement claims</li>
              <li>Agree that tokenized content may be traded on secondary markets</li>
              <li>Understand that blockchain transactions are permanent and irreversible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Tokenization Features</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">5.1 Track Tokenization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Artists may tokenize their tracks as ERC20 tokens or NFTs. Once tokenized, these assets are governed
                  by smart contracts on the Base blockchain. USIC is not responsible for the performance or value of
                  tokenized assets.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">5.2 Profile Tokenization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Artists meeting eligibility requirements (10,000,000 $USI tokens and 5+ uploaded tracks) may tokenize
                  their profile once via Clanker integration. This is a one-time, irreversible action. Profile tokens
                  are deployed on Base blockchain and may be traded on decentralized exchanges.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">5.3 Token-Gated Streaming</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Artists may enable token-gated streaming, allowing holders of specified token amounts to stream
                  content without X402 micropayments. Token balance verification occurs on-chain and is subject to
                  blockchain confirmation times.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Payments and Fees</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All payments on USIC are processed on-chain using cryptocurrency:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>X402 streaming payments are processed in USDC on Base blockchain</li>
              <li>Platform fees are automatically deducted from transactions via smart contracts</li>
              <li>Gas fees for blockchain transactions are paid by the transaction initiator</li>
              <li>Artists are responsible for all applicable taxes on earnings</li>
              <li>Token swaps via Uniswap V4 are subject to slippage and liquidity pool fees</li>
              <li>All cryptocurrency transactions are final and irreversible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Users are strictly prohibited from:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Uploading content without proper rights or licenses</li>
              <li>Manipulating play counts, engagement metrics, or token prices</li>
              <li>Using the Platform for money laundering or illegal activities</li>
              <li>Attempting to exploit, hack, or compromise Platform security</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Creating multiple accounts to circumvent restrictions</li>
              <li>Reverse engineering or copying Platform code or smart contracts</li>
              <li>Using bots or automated systems to interact with the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Smart Contract Risks</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By using USIC, you acknowledge and accept the following risks:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Smart contracts may contain bugs or vulnerabilities</li>
              <li>Blockchain networks may experience downtime or congestion</li>
              <li>Cryptocurrency values are highly volatile</li>
              <li>Transactions cannot be reversed once confirmed on-chain</li>
              <li>Private key loss results in permanent loss of access to assets</li>
              <li>Regulatory changes may affect Platform functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              USIC is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied,
              including but not limited to implied warranties of merchantability, fitness for a particular purpose, or
              non-infringement. We do not warrant that the Platform will be uninterrupted, secure, or error-free. We are
              not responsible for losses due to smart contract bugs, blockchain issues, market volatility, or user
              error.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, USIC and its operators shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to loss of profits,
              data, use, goodwill, or other intangible losses resulting from your use of the Platform, even if we have
              been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless USIC and its operators from any claims, damages, losses,
              liabilities, and expenses (including legal fees) arising from your use of the Platform, violation of these
              Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting
              to myusic.xyz. Your continued use of the Platform after changes constitutes acceptance of the modified
              Terms. We encourage you to review these Terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend access to the Platform immediately, without prior notice or
              liability, for any reason, including breach of these Terms. Upon termination, your right to use the
              Platform will immediately cease. Note that blockchain transactions and tokenized assets are permanent and
              cannot be reversed by Platform termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to
              conflict of law provisions. Any disputes arising from these Terms or use of the Platform shall be resolved
              through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions, concerns, or notices regarding these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Email: legal@myusic.xyz
              <br />
              Website: myusic.xyz
            </p>
          </section>

          <section className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              By using USIC, you acknowledge that you have read, understood, and agree to be bound by these Terms of
              Service and our Privacy Policy. If you do not agree to these terms, you must not access or use the
              Platform.
            </p>
          </section>
        </Card>
      </main>
    </div>
  )
}
