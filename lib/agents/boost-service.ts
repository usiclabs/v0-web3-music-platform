import { createAdminClient } from "@/lib/supabase/admin"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { encrypt } from "@/lib/crypto"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

export class BoostService {
  async createBoost(
    ownerAddress: string,
    artistAddress: string,
    tokenAddress: string,
    tokenSymbol: string,
    initialEthFunding: bigint,
  ) {
    const supabase = createAdminClient()

    // Create boost record
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        owner_address: ownerAddress,
        artist_address: artistAddress,
        token_address: tokenAddress,
        token_symbol: tokenSymbol,
        initial_eth_funding: initialEthFunding.toString(),
        current_balance: initialEthFunding.toString(),
        status: "active",
      })
      .select()
      .single()

    if (boostError) throw boostError

    // Create wallet for boost
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const encryptedKey = encrypt(privateKey)

    const { error: walletError } = await supabase.from("boost_wallets").insert({
      boost_id: boost.id,
      wallet_address: account.address,
      private_key_encrypted: encryptedKey,
    })

    if (walletError) throw walletError

    return {
      boostId: boost.id,
      walletAddress: account.address,
      initialFunding: initialEthFunding.toString(),
    }
  }

  async getBoosts(ownerAddress: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("boosts")
      .select("*")
      .eq("owner_address", ownerAddress)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  async getBoostDetails(boostId: string) {
    const supabase = createAdminClient()

    const { data: boost, error: boostError } = await supabase.from("boosts").select("*").eq("id", boostId).single()

    if (boostError) throw boostError

    const { data: wallet, error: walletError } = await supabase
      .from("boost_wallets")
      .select("*")
      .eq("boost_id", boostId)
      .single()

    if (walletError) throw walletError

    const { data: activity, error: activityError } = await supabase
      .from("boost_activity")
      .select("*")
      .eq("boost_id", boostId)
      .order("created_at", { ascending: false })

    if (activityError) throw activityError

    return { boost, wallet, activity }
  }

  async updateBoostBalance(boostId: string, newBalance: bigint) {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("boosts")
      .update({
        current_balance: newBalance.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", boostId)

    if (error) throw error
  }

  async logBoostActivity(
    boostId: string,
    activityType: string,
    txHash?: string,
    amountTraded?: bigint,
    profitLoss?: bigint,
    gasFee?: bigint,
  ) {
    const supabase = createAdminClient()

    const { error } = await supabase.from("boost_activity").insert({
      boost_id: boostId,
      activity_type: activityType,
      tx_hash: txHash,
      amount_traded: amountTraded?.toString(),
      profit_loss: profitLoss?.toString(),
      gas_fee: gasFee?.toString(),
    })

    if (error) throw error
  }

  async pauseBoost(boostId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.from("boosts").update({ status: "paused" }).eq("id", boostId)

    if (error) throw error
  }

  async resumeBoost(boostId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.from("boosts").update({ status: "active" }).eq("id", boostId)

    if (error) throw error
  }

  async stopBoost(boostId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.from("boosts").update({ status: "stopped" }).eq("id", boostId)

    if (error) throw error
  }
}

export const boostService = new BoostService()
