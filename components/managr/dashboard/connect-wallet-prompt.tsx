"use client"

import { Wallet } from "lucide-react"
import Link from "next/link"

export function ConnectWalletPrompt() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto px-4">
        <div className="rounded-lg bg-gradient-to-br from-red-900/10 to-red-900/5 border border-red-500/20 p-8 text-center">
          <Wallet className="w-16 h-16 text-red-400/60 mx-auto mb-6" />

          <h2 className="text-3xl font-bold mb-3 font-display">Connect Your Wallet</h2>

          <p className="text-gray-400 mb-8">
            To access your MANAGR dashboard and manage your autonomous music agents, please connect your wallet.
          </p>

          <div className="space-y-3 mb-8">
            <p className="text-sm text-gray-500">You can connect your wallet using the button in the header, or:</p>
            <a
              href="/"
              className="inline-block w-full px-6 py-3 bg-red-500/80 hover:bg-red-600 text-white font-semibold rounded-lg transition"
            >
              Go to Home
            </a>
          </div>

          <div className="pt-6 border-t border-gray-700/50">
            <Link href="/managr" className="text-gray-400 hover:text-gray-300 transition text-sm">
              ← Back to MANAGR
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
