import { createAdminClient } from "@/lib/supabase/admin"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { parseUnits, type Address } from "viem"
import { encrypt, decrypt } from "@/lib/crypto"
import { UNISWAP_V3_ROUTER, UNISWAP_V3_ROUTER_ABI } from "@/lib/web3/contracts"

export class BoostService {
  async createBoost(
    boostedByAddress: Address,
    artistAddress: Address,
    tokenAddress: Address,
    tokenSymbol: string,
    fundingAmountEth: number,
  ) {
    const supabase = createAdminClient()

    // Create boost record
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        boosted_by_address: boostedByAddress.toLowerCase(),
        artist_address: artistAddress.toLowerCase(),
        token_address: tokenAddress.toLowerCase(),
        token_symbol: tokenSymbol,
        initial_eth_funding: fundingAmountEth,
        current_balance: fundingAmountEth,
      })
      .select()
      .single()

    if (boostError || !boost) throw new Error(`Failed to create boost: ${boostError?.message}`)

    const privateKey = generatePrivateKey()
    const wallet = privateKeyToAccount(privateKey)
    const encryptedKey = encrypt(privateKey)

    const { data: boostWallet, error: walletError } = await supabase
      .from("boost_wallets")
      .insert({
        boost_id: boost.id,
        wallet_address: wallet.address,
        private_key_encrypted: encryptedKey,
        eth_balance: fundingAmountEth,
      })
      .select()
      .single()

    if (walletError || !boostWallet) throw new Error(`Failed to create wallet: ${walletError?.message}`)

    return { boost, wallet: boostWallet }
  }

  async getBoostsByUser(userAddress: Address) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("boosts")
      .select("*, boost_wallets(*), boost_activity(*)")
      .eq("boosted_by_address", userAddress.toLowerCase())
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch boosts: ${error.message}`)
    return data
  }

  async logActivity(
    boostId: string,
    activityType: string,
    data: {
      txHash?: string
      tokenAmount?: number
      ethAmount?: number
      pricePerToken?: number
      profitLoss?: number
      slippage?: number
      gasUsed?: number
      status?: string
      error?: string
    },
  ) {
    const supabase = createAdminClient()

    const { error } = await supabase.from("boost_activity").insert({
      boost_id: boostId,
      activity_type: activityType,
      tx_hash: data.txHash,
      token_amount: data.tokenAmount,
      eth_amount: data.ethAmount,
      price_per_token: data.pricePerToken,
      profit_loss: data.profitLoss,
      slippage_percent: data.slippage,
      gas_used: data.gasUsed,
      status: data.status || "completed",
      error_message: data.error,
    })

    if (error) throw new Error(`Failed to log activity: ${error.message}`)
  }

  async executeBoostTrade(boostId: string, tokenAddress: Address, tradeType: "buy" | "sell") {
    const supabase = createAdminClient()

    // Get boost and wallet
    const { data: boost } = await supabase.from("boosts").select("*").eq("id", boostId).single()

    if (!boost) throw new Error("Boost not found")

    const { data: boostWallet } = await supabase.from("boost_wallets").select("*").eq("boost_id", boostId).single()

    if (!boostWallet) throw new Error("Boost wallet not found")

    const decryptedKey = decrypt(boostWallet.private_key_encrypted)
    const account = privateKeyToAccount(decryptedKey as `0x${string}`)

    const publicClient = createPublicClient({ chain: base, transport: http() })
    const walletClient = createWalletClient({ account, chain: base, transport: http() })

    try {
      const routerAddress = UNISWAP_V3_ROUTER[8453 as keyof typeof UNISWAP_V3_ROUTER] as Address

      const amountIn = parseUnits("0.0001", 18) // 0.0001 ETH minimum

      const txHash = await walletClient.writeContract({
        address: routerAddress,
        abi: UNISWAP_V3_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as Address,
            tokenOut: tokenAddress,
            fee: 3000,
            recipient: account.address,
            amountIn,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })

      await this.logActivity(boostId, tradeType, {
        txHash,
        ethAmount: 0.0001,
        status: "pending",
      })

      return { success: true, txHash }
    } catch (error: any) {
      await this.logActivity(boostId, tradeType, {
        status: "failed",
        error: error.message,
      })
      throw error
    }
  }
}

export const boostService = new BoostService()
