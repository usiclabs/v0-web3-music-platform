import { Button } from "@/components/ui/button"
import { Download, Mail, FileText, ImageIcon, Video } from "lucide-react"

export default function PressKitPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Press Kit</h1>
          <p className="text-xl text-muted-foreground">Media resources and brand assets for USI</p>
        </div>

        {/* About Section */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-4">About USI</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              USI is a decentralized music streaming platform built on Base that enables instant micropayments between
              fans and artists using the X402 protocol. We're revolutionizing music streaming by eliminating middlemen
              and ensuring artists get paid instantly for every stream.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2025, USI combines blockchain technology with innovative payment protocols to create a fair,
              transparent, and artist-first music ecosystem.
            </p>
          </div>
        </section>

        {/* Brand Assets */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-3xl font-bold mb-6">Brand Assets</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Logo Pack</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Full color, monochrome, and icon versions in PNG and SVG formats
              </p>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Logos
              </Button>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Brand Guidelines</h3>
              </div>
              <p className="text-muted-foreground mb-4">Typography, colors, spacing, and usage guidelines</p>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-chart-3/20 border border-chart-3/30 flex items-center justify-center">
                  <Video className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="text-xl font-semibold">Product Screenshots</h3>
              </div>
              <p className="text-muted-foreground mb-4">High-resolution screenshots of the platform interface</p>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Images
              </Button>
            </div>

            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Fact Sheet</h3>
              </div>
              <p className="text-muted-foreground mb-4">Key facts, statistics, and company information</p>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </section>

        {/* Key Facts */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-3xl font-bold mb-6">Key Facts</h2>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Founded</h3>
                <p className="text-muted-foreground">2025</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Blockchain</h3>
                <p className="text-muted-foreground">Base (Ethereum L2)</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Token</h3>
                <p className="text-muted-foreground">$USI</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Protocol</h3>
                <p className="text-muted-foreground">X402 Micropayments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
            <p className="text-muted-foreground mb-6">For press inquiries, interviews, or additional information</p>
            <Button size="lg" className="gap-2">
              <Mail className="h-4 w-4" />
              Contact Press Team
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
