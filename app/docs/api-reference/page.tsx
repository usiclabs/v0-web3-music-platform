import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function APIReferencePage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">API Reference</h1>
          <p className="text-xl text-muted-foreground">
            Complete REST API documentation for building integrations with USIC.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Base URL</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <code className="text-lg">https://usic.app/api</code>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">Tracks</h2>

            <div className="space-y-6">
              <APIEndpoint
                method="GET"
                path="/tracks"
                description="Get all tracks with pagination"
                params={[
                  { name: "page", type: "number", description: "Page number (default: 1)" },
                  { name: "limit", type: "number", description: "Items per page (default: 20)" },
                  { name: "genre", type: "string", description: "Filter by genre" },
                ]}
                response={`{
  "tracks": [
    {
      "id": "abc123",
      "title": "Track Title",
      "artist_address": "0x1234...",
      "artist_name": "Artist Name",
      "genre": "Electronic",
      "duration": 180,
      "audio_url": "ipfs://...",
      "cover_url": "ipfs://...",
      "stream_count": 1234,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}`}
              />

              <APIEndpoint
                method="GET"
                path="/tracks/:id"
                description="Get a specific track by ID"
                response={`{
  "id": "abc123",
  "title": "Track Title",
  "artist_address": "0x1234...",
  "artist_name": "Artist Name",
  "genre": "Electronic",
  "duration": 180,
  "audio_url": "ipfs://...",
  "cover_url": "ipfs://...",
  "stream_count": 1234,
  "created_at": "2025-01-01T00:00:00Z"
}`}
              />

              <APIEndpoint
                method="GET"
                path="/tracks/trending"
                description="Get trending tracks"
                params={[{ name: "limit", type: "number", description: "Number of tracks (default: 10)" }]}
                response={`{
  "tracks": [...]
}`}
              />
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Artists</h2>

            <div className="space-y-6">
              <APIEndpoint
                method="GET"
                path="/artists/:address"
                description="Get artist profile by wallet address"
                response={`{
  "wallet_address": "0x1234...",
  "artist_name": "Artist Name",
  "bio": "Artist bio",
  "avatar_url": "ipfs://...",
  "total_streams": 10000,
  "total_revenue": "100.00",
  "track_count": 25,
  "follower_count": 500
}`}
              />

              <APIEndpoint
                method="GET"
                path="/artists/:address/tracks"
                description="Get all tracks by an artist"
                response={`{
  "tracks": [...]
}`}
              />
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Streaming</h2>

            <div className="space-y-6">
              <APIEndpoint
                method="POST"
                path="/x402/chunk"
                description="Submit a payment chunk during streaming"
                body={`{
  "track_id": "abc123",
  "chunk_index": 5,
  "amount": "10000",
  "timestamp": 1234567890,
  "signature": "0xdef..."
}`}
                response={`{
  "success": true,
  "chunk_index": 5,
  "total_paid": "50000"
}`}
              />

              <APIEndpoint
                method="POST"
                path="/x402/settle"
                description="Settle final payment for a stream"
                body={`{
  "track_id": "abc123",
  "final_amount": "100000",
  "signature": "0xabc..."
}`}
                response={`{
  "success": true,
  "tx_hash": "0x123...",
  "total_paid": "100000"
}`}
              />
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-bold mb-4">Stats</h2>

            <div className="space-y-6">
              <APIEndpoint
                method="GET"
                path="/stats/platform"
                description="Get platform-wide statistics"
                response={`{
  "total_streams": 1000000,
  "total_revenue": "10000.00",
  "total_artists": 500,
  "total_tracks": 5000,
  "usi_price": "0.000001",
  "usi_market_cap": "129490000",
  "usi_volume_24h": "7630000"
}`}
              />

              <APIEndpoint
                method="GET"
                path="/stats/artist/:address"
                description="Get artist statistics"
                response={`{
  "total_streams": 10000,
  "total_revenue": "100.00",
  "streams_24h": 150,
  "revenue_24h": "1.50",
  "top_track": {
    "id": "abc123",
    "title": "Track Title",
    "streams": 5000
  }
}`}
              />
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                Join our developer community for API support and discussions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Join Discord
                  </button>
                </Link>
                <Link href="/docs/x402-protocol">
                  <button className="px-6 py-3 bg-transparent border border-border rounded-lg font-semibold hover:bg-muted/10 transition-colors">
                    X402 Protocol
                  </button>
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

function APIEndpoint({
  method,
  path,
  description,
  params,
  body,
  response,
}: {
  method: string
  path: string
  description: string
  params?: Array<{ name: string; type: string; description: string }>
  body?: string
  response: string
}) {
  const methodColors = {
    GET: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    POST: "bg-green-500/20 text-green-400 border-green-500/50",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/50",
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`px-3 py-1 rounded-md text-sm font-semibold border ${methodColors[method as keyof typeof methodColors]}`}
        >
          {method}
        </span>
        <code className="text-lg">{path}</code>
      </div>
      <p className="text-muted-foreground mb-4">{description}</p>

      {params && params.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Query Parameters</h4>
          <div className="space-y-2">
            {params.map((param) => (
              <div key={param.name} className="text-sm">
                <code className="text-primary">{param.name}</code>
                <span className="text-muted-foreground"> ({param.type})</span>
                <span className="text-muted-foreground"> - {param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {body && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Request Body</h4>
          <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono">{body}</pre>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-2">Response</h4>
        <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm font-mono">{response}</pre>
        </div>
      </div>
    </Card>
  )
}
