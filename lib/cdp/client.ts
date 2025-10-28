import { Coinbase, type Wallet } from "@coinbase/coinbase-sdk"

// CDP Client singleton
let cdpClient: Coinbase | null = null

/**
 * Initialize CDP client with API credentials
 * Requires CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables
 */
export function getCDPClient(): Coinbase {
  if (cdpClient) {
    return cdpClient
  }

  const apiKeyName = process.env.CDP_API_KEY_NAME
  const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY

  if (!apiKeyName || !privateKey) {
    throw new Error(
      "CDP API credentials not configured. Please set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables.",
    )
  }

  cdpClient = Coinbase.configureFromJson({
    apiKeyName,
    privateKey,
  })

  console.log("[CDP] Client initialized successfully")
  return cdpClient
}

/**
 * Get or create a server wallet for automated operations
 * This wallet is used for:
 * - Automated artist payouts
 * - Gasless transaction sponsorship
 * - Platform operations
 */
export async function getServerWallet(): Promise<Wallet> {
  const client = getCDPClient()

  // Try to load existing wallet from environment
  const walletData = process.env.CDP_SERVER_WALLET_DATA

  if (walletData) {
    try {
      const wallet = await client.importWallet(JSON.parse(walletData))
      console.log("[CDP] Server wallet loaded from environment")
      return wallet
    } catch (error) {
      console.error("[CDP] Failed to load server wallet:", error)
    }
  }

  // Create new wallet if none exists
  console.log("[CDP] Creating new server wallet...")
  const wallet = await client.createWallet({
    networkId: "base-mainnet",
  })

  // Export wallet data for persistence
  const exportedData = await wallet.export()
  console.log("[CDP] Server wallet created. Save this data to CDP_SERVER_WALLET_DATA environment variable:")
  console.log(JSON.stringify(exportedData))

  return wallet
}

/**
 * Get wallet balance for a specific asset
 */
export async function getWalletBalance(wallet: Wallet, assetId = "usdc"): Promise<string> {
  const balance = await wallet.getBalance(assetId)
  return balance.toString()
}

/**
 * Send tokens from server wallet to recipient
 * Used for artist payouts and rewards
 */
export async function sendTokens(recipientAddress: string, amount: string, assetId = "usdc"): Promise<string> {
  const wallet = await getServerWallet()

  console.log(`[CDP] Sending ${amount} ${assetId} to ${recipientAddress}`)

  const transfer = await wallet.createTransfer({
    amount,
    assetId,
    destination: recipientAddress,
    gasless: true, // Use Paymaster for gasless transactions
  })

  await transfer.wait()

  console.log(`[CDP] Transfer completed: ${transfer.getTransactionHash()}`)
  return transfer.getTransactionHash() || ""
}

/**
 * Batch send tokens to multiple recipients
 * Efficient for bulk artist payouts
 */
export async function batchSendTokens(
  recipients: Array<{ address: string; amount: string }>,
  assetId = "usdc",
): Promise<string[]> {
  const wallet = await getServerWallet()
  const txHashes: string[] = []

  console.log(`[CDP] Batch sending ${assetId} to ${recipients.length} recipients`)

  for (const recipient of recipients) {
    try {
      const transfer = await wallet.createTransfer({
        amount: recipient.amount,
        assetId,
        destination: recipient.address,
        gasless: true,
      })

      await transfer.wait()
      const txHash = transfer.getTransactionHash() || ""
      txHashes.push(txHash)

      console.log(`[CDP] Sent ${recipient.amount} to ${recipient.address}: ${txHash}`)
    } catch (error) {
      console.error(`[CDP] Failed to send to ${recipient.address}:`, error)
      txHashes.push("")
    }
  }

  return txHashes
}

/**
 * Check if CDP is properly configured
 */
export function isCDPConfigured(): boolean {
  return !!(process.env.CDP_API_KEY_NAME && process.env.CDP_API_KEY_PRIVATE_KEY)
}
