import { privateKeyToAccount } from "viem/accounts"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Encryption helpers (same as MM agent)
function encryptData(data: string): string {
  const algorithm = "aes-256-cbc"
  const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY || "default-key-change-in-production-32b", "utf8").subarray(
    0,
    32,
  )
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

function decryptData(encryptedData: string): string {
  const algorithm = "aes-256-cbc"
  const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY || "default-key-change-in-production-32b", "utf8").subarray(
    0,
    32,
  )
  const parts = encryptedData.split(":")
  const iv = Buffer.from(parts[0], "hex")
  const encryptedText = parts[1]
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export async function createOrGetInvestmentWallet(agentId: string) {
  // Check if wallet already exists
  const { data: existingWallet } = await supabase
    .from("investment_agent_wallets")
    .select("*")
    .eq("agent_id", agentId)
    .single()

  if (existingWallet) {
    return {
      address: existingWallet.wallet_address,
      usdcBalance: existingWallet.usdc_balance,
      ethBalance: existingWallet.eth_balance,
    }
  }

  // Generate new wallet
  const privateKey = `0x${crypto.randomBytes(32).toString("hex")}` as `0x${string}`
  const wallet = privateKeyToAccount(privateKey)
  const encryptedKey = encryptData(privateKey) // Encrypt the private key, not the address!

  // Store in database
  const { data: newWallet, error } = await supabase
    .from("investment_agent_wallets")
    .insert({
      agent_id: agentId,
      wallet_address: wallet.address,
      private_key_encrypted: encryptedKey,
      is_active: true,
      usdc_balance: 0,
      eth_balance: 0,
    })
    .select()
    .single()

  if (error) throw error

  return {
    address: newWallet.wallet_address,
    usdcBalance: 0,
    ethBalance: 0,
  }
}

export async function getInvestmentWalletAccount(agentId: string) {
  const { data: wallet } = await supabase.from("investment_agent_wallets").select("*").eq("agent_id", agentId).single()

  if (!wallet) throw new Error("Wallet not found")

  const privateKey = decryptData(wallet.private_key_encrypted)
  return privateKeyToAccount(privateKey as `0x${string}`)
}

export async function updateInvestmentWalletBalance(agentId: string, usdcBalance?: number, ethBalance?: number) {
  const updates: any = { last_used_at: new Date().toISOString() }
  if (usdcBalance !== undefined) updates.usdc_balance = usdcBalance
  if (ethBalance !== undefined) updates.eth_balance = ethBalance

  const { error } = await supabase.from("investment_agent_wallets").update(updates).eq("agent_id", agentId)

  if (error) throw error
}
