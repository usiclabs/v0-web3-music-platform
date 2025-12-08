import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Simple XOR encryption for storing private keys
 * In production, use proper encryption like AES-256
 */
function encryptPrivateKey(privateKey: string, userAddress: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production"
  const combined = key + userAddress
  let encrypted = ""

  for (let i = 0; i < privateKey.length; i++) {
    const charCode = privateKey.charCodeAt(i) ^ combined.charCodeAt(i % combined.length)
    encrypted += String.fromCharCode(charCode)
  }

  return Buffer.from(encrypted).toString("base64")
}

function decryptPrivateKey(encrypted: string, userAddress: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production"
  const combined = key + userAddress
  const decoded = Buffer.from(encrypted, "base64").toString()
  let decrypted = ""

  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i) ^ combined.charCodeAt(i % combined.length)
    decrypted += String.fromCharCode(charCode)
  }

  return decrypted
}

export interface GeneratedWallet {
  address: string
  privateKey: string
  index: number
}

/**
 * Generate wallets for a user's MM agent
 * @param count - Number of wallets to generate (5 for standard, 10 for pro)
 * @param startIndex - Starting index for wallet numbering (1 for initial, 6 for pro upgrade)
 */
export async function generateWalletsForAgent(
  agentId: string,
  ownerAddress: string,
  count = 5,
  startIndex = 1,
): Promise<GeneratedWallet[]> {
  const supabase = createAdminClient()
  const wallets: GeneratedWallet[] = []

  for (let i = 0; i < count; i++) {
    const walletIndex = startIndex + i
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)

    // Encrypt the private key before storing
    const encrypted = encryptPrivateKey(privateKey, ownerAddress)

    // Store in database
    const { error } = await supabase.from("mm_agent_wallets").insert({
      agent_id: agentId,
      wallet_index: walletIndex,
      wallet_address: account.address,
      private_key_encrypted: encrypted,
      is_active: true,
    })

    if (error) {
      console.error(`[WalletGenerator] Failed to store wallet ${walletIndex}:`, error)
      throw new Error(`Failed to generate wallet ${walletIndex}: ${error.message}`)
    }

    wallets.push({
      address: account.address,
      privateKey: privateKey,
      index: walletIndex,
    })
  }

  console.log(`[WalletGenerator] Generated ${wallets.length} wallets for agent ${agentId}`)
  return wallets
}

/**
 * Retrieve decrypted private keys for an agent's wallets
 */
export async function getAgentWalletKeys(agentId: string, ownerAddress: string): Promise<Map<number, string>> {
  const supabase = createAdminClient()

  const { data: wallets, error } = await supabase
    .from("mm_agent_wallets")
    .select("wallet_index, private_key_encrypted")
    .eq("agent_id", agentId)
    .eq("is_active", true)
    .order("wallet_index")

  if (error) {
    throw new Error(`Failed to retrieve wallet keys: ${error.message}`)
  }

  const keyMap = new Map<number, string>()

  for (const wallet of wallets || []) {
    const decrypted = decryptPrivateKey(wallet.private_key_encrypted, ownerAddress)
    keyMap.set(wallet.wallet_index, decrypted)
  }

  return keyMap
}

export { encryptPrivateKey, decryptPrivateKey }
