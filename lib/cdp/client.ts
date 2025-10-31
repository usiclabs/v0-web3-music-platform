import { Coinbase, Wallet } from "@coinbase/coinbase-sdk"

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

  // Handle multiline private keys (replace escaped newlines with actual newlines)
  const formattedPrivateKey = privateKey.replace(/\\n/g, "\n")

  cdpClient = new Coinbase({
    apiKeyName,
    privateKey: formattedPrivateKey,
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
  getCDPClient()

  // Try to load existing wallet from environment
  const walletData = process.env.CDP_SERVER_WALLET_DATA

  if (walletData) {
    try {
      console.log("[CDP] Attempting to load server wallet from environment...")
      console.log(`[CDP] Wallet data preview: ${walletData.substring(0, 50)}...`)

      let parsedData: any

      try {
        // First, try direct JSON parse
        parsedData = JSON.parse(walletData)
      } catch (jsonError) {
        console.log("[CDP] Direct JSON parse failed, attempting base64 decode...")

        try {
          // Try base64 decode then JSON parse
          const decoded = Buffer.from(walletData, "base64").toString("utf-8")
          parsedData = JSON.parse(decoded)
          console.log("[CDP] Successfully decoded base64 wallet data")
        } catch (base64Error) {
          throw new Error(
            `Wallet data is not valid JSON or base64-encoded JSON. ` +
              `Expected format: JSON object from wallet.export(). ` +
              `Data preview: ${walletData.substring(0, 50)}...`,
          )
        }
      }

      const wallet = await Wallet.import(parsedData)
      console.log("[CDP] Server wallet loaded successfully")
      return wallet
    } catch (error) {
      console.error("[CDP] Failed to load server wallet:", error)
      throw new Error(`Failed to load server wallet: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log("[CDP] No CDP_SERVER_WALLET_DATA found. Creating new server wallet...")
  const wallet = await Wallet.create({
    networkId: Coinbase.networks.BaseMainnet,
  })

  // Export wallet data for persistence
  const exportedData = await wallet.export()
  const exportedJson = JSON.stringify(exportedData)

  console.log("[CDP] ========================================")
  console.log("[CDP] NEW SERVER WALLET CREATED")
  console.log("[CDP] ========================================")
  console.log("[CDP] Save this JSON data to your CDP_SERVER_WALLET_DATA environment variable:")
  console.log(exportedJson)
  console.log("[CDP] ========================================")
  console.log("[CDP] Wallet address:", await wallet.getDefaultAddress())
  console.log("[CDP] ========================================")

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

// Additional functionality for handling different networks
export async function getWalletForNetwork(networkId: string): Promise<Wallet> {
  const walletData = process.env[`CDP_SERVER_WALLET_DATA_${networkId.toUpperCase()}`]

  if (walletData) {
    try {
      console.log(`[CDP] Attempting to load server wallet for network ${networkId} from environment...`)
      console.log(`[CDP] Wallet data preview: ${walletData.substring(0, 50)}...`)

      let parsedData: any

      try {
        // First, try direct JSON parse
        parsedData = JSON.parse(walletData)
      } catch (jsonError) {
        console.log("[CDP] Direct JSON parse failed, attempting base64 decode...")

        try {
          // Try base64 decode then JSON parse
          const decoded = Buffer.from(walletData, "base64").toString("utf-8")
          parsedData = JSON.parse(decoded)
          console.log("[CDP] Successfully decoded base64 wallet data")
        } catch (base64Error) {
          throw new Error(
            `Wallet data is not valid JSON or base64-encoded JSON. ` +
              `Expected format: JSON object from wallet.export(). ` +
              `Data preview: ${walletData.substring(0, 50)}...`,
          )
        }
      }

      const wallet = await Wallet.import(parsedData)
      console.log(`[CDP] Server wallet for network ${networkId} loaded successfully`)
      return wallet
    } catch (error) {
      console.error(`[CDP] Failed to load server wallet for network ${networkId}:`, error)
      throw new Error(
        `Failed to load server wallet for network ${networkId}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  console.log(
    `[CDP] No CDP_SERVER_WALLET_DATA_${networkId.toUpperCase()} found. Creating new server wallet for network ${networkId}...`,
  )
  const wallet = await Wallet.create({
    networkId,
  })

  // Export wallet data for persistence
  const exportedData = await wallet.export()
  const exportedJson = JSON.stringify(exportedData)

  console.log("[CDP] ========================================")
  console.log(`[CDP] NEW SERVER WALLET CREATED FOR NETWORK ${networkId.toUpperCase()}`)
  console.log("[CDP] ========================================")
  console.log(
    `[CDP] Save this JSON data to your CDP_SERVER_WALLET_DATA_${networkId.toUpperCase()} environment variable:`,
  )
  console.log(exportedJson)
  console.log("[CDP] ========================================")
  console.log(`[CDP] Wallet address:`, await wallet.getDefaultAddress())
  console.log("[CDP] ========================================")

  return wallet
}
