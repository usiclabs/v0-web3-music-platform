import { createClient } from "@/lib/supabase/server"
import { formatUnits, type Address, parseUnits } from "viem"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { detectV4Pool, getV4Quote, executeV4Swap, type V4PoolKey } from "@/lib/web3/uniswap-v4-swap"
import { ERC20_ABI, WETH_ADDRESS } from "@/lib/web3/contracts"
import { getAgentWalletKeys } from "./wallet-generator"

/**
 * Market Maker Agent Service for Uniswap V4 Pools
 * Handles liquidity management on V4 pools with hook support
 */
export class MarketMakerV4Service {
  private agentId: string
  private ownerAddress: string | null = null
  private _walletKeys: Map<number, string> = new Map()
  private _walletAccounts: Map<number, any> = new Map()

  constructor(agentId: string, ownerAddress?: string) {
    this.agentId = agentId
    this.ownerAddress = ownerAddress || null
  }

  /**
   * Detect if a token has a V4 pool and get pool configuration
   */
  async detectPoolConfiguration(
    tokenAddress: Address,
    chainId: number = base.id,
  ): Promise<{ isV4: boolean; poolKey?: V4PoolKey; liquidity?: bigint; error?: string }> {
    try {
      const rpcUrl = "https://base-rpc.publicnode.com"
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      console.log(`[V4 MM] Detecting pool for token: ${tokenAddress}`)

      const poolKey = await detectV4Pool(tokenAddress, chainId, publicClient)

      if (!poolKey) {
        console.log(`[V4 MM] No V4 pool found for token: ${tokenAddress}`)
        return { isV4: false, error: "No V4 pool found" }
      }

      // Get liquidity
      const { UNISWAP_V4_STATE_VIEW, UNISWAP_V4_STATE_VIEW_ABI } = await import("@/lib/web3/contracts")
      const stateViewAddress = UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW] as Address

      const liquidity = (await publicClient.readContract({
        address: stateViewAddress,
        abi: UNISWAP_V4_STATE_VIEW_ABI,
        functionName: "getLiquidity",
        args: [poolKey],
      })) as bigint

      console.log(`[V4 MM] V4 Pool found!`, {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
        liquidity: formatUnits(liquidity, 18),
      })

      return { isV4: true, poolKey, liquidity }
    } catch (error: any) {
      console.error("[V4 MM] Error detecting pool:", error.message)
      return { isV4: false, error: error.message }
    }
  }

  /**
   * Execute a V4 swap
   */
  async executeV4Swap(
    tokenAddress: Address,
    poolKey: V4PoolKey,
    buyAmount: bigint,
    walletIndex: number = 1,
  ): Promise<{ success: boolean; txHash?: string; amountOut?: string; error?: string }> {
    try {
      await this.loadWalletKeys()
      const wallet = await this.getWallet(walletIndex)

      const rpcUrl = "https://base-rpc.publicnode.com"
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      const walletClient = createWalletClient({
        chain: base,
        transport: http(rpcUrl),
        account: wallet,
      })

      // Get quote for output
      const zeroForOne = tokenAddress.toLowerCase() > WETH_ADDRESS[base.id].toLowerCase()
      const amountOut = await getV4Quote(poolKey, buyAmount, zeroForOne, publicClient, base.id)

      const minAmountOut = (amountOut * 95n) / 100n // 5% slippage

      console.log(`[V4 MM] Executing V4 swap:`, {
        amountIn: formatUnits(buyAmount, 18),
        amountOut: formatUnits(amountOut, 18),
        minAmountOut: formatUnits(minAmountOut, 18),
      })

      // Ensure approval
      const wethAddress = WETH_ADDRESS[base.id] as Address
      const { UNISWAP_V4_POOL_MANAGER } = await import("@/lib/web3/contracts")
      const poolManagerAddress = UNISWAP_V4_POOL_MANAGER[base.id] as Address

      // Check and approve if needed
      const allowance = (await publicClient.readContract({
        address: wethAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address, poolManagerAddress],
      })) as bigint

      if (allowance < buyAmount) {
        console.log(`[V4 MM] Approving tokens for PoolManager...`)
        const approveTx = await walletClient.writeContract({
          address: wethAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [poolManagerAddress, buyAmount],
        })
        await publicClient.waitForTransactionReceipt({ hash: approveTx })
      }

      // Execute swap
      const result = await executeV4Swap(
        {
          tokenIn: wethAddress,
          tokenOut: tokenAddress,
          amountIn: buyAmount,
          amountOutMinimum: minAmountOut,
          recipient: wallet.address,
          chainId: base.id,
        },
        poolKey,
        walletClient,
        publicClient,
      )

      if (result.success) {
        await this.recordV4Trade("v4_buy", buyAmount, amountOut, result.txHash!, wallet.address, poolKey)
        return { success: true, txHash: result.txHash, amountOut: formatUnits(amountOut, 18) }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      console.error("[V4 MM] Swap error:", error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Load wallet keys for agent
   */
  private async loadWalletKeys(): Promise<void> {
    if (this._walletKeys.size > 0) return

    if (!this.ownerAddress) {
      const supabase = await createClient()
      const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", this.agentId).single()

      if (!agent?.owner_address) {
        throw new Error("Agent owner address not found")
      }
      this.ownerAddress = agent.owner_address
    }

    this._walletKeys = await getAgentWalletKeys(this.agentId, this.ownerAddress)

    if (this._walletKeys.size === 0) {
      throw new Error("No wallets found for agent")
    }

    console.log(`[V4 MM] Loaded ${this._walletKeys.size} wallet keys`)
  }

  /**
   * Get wallet account
   */
  private async getWallet(walletIndex: number): Promise<any> {
    if (this._walletAccounts.has(walletIndex)) {
      return this._walletAccounts.get(walletIndex)
    }

    const privateKey = this._walletKeys.get(walletIndex)
    if (!privateKey) {
      throw new Error(`Wallet ${walletIndex} not found`)
    }

    const formattedKey = privateKey.startsWith("0x") ? (privateKey as `0x${string}`) : (`0x${privateKey}` as `0x${string}`)
    const account = privateKeyToAccount(formattedKey)
    this._walletAccounts.set(walletIndex, account)
    return account
  }

  /**
   * Record V4 trade in database
   */
  private async recordV4Trade(
    action: string,
    amountIn: bigint,
    amountOut: bigint,
    txHash: string,
    walletAddress: Address,
    poolKey: V4PoolKey,
  ): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("mm_v4_trades").insert({
        agent_id: this.agentId,
        wallet_address: walletAddress,
        action,
        amount_in: formatUnits(amountIn, 18),
        amount_out: formatUnits(amountOut, 18),
        tx_hash: txHash,
        pool_key: {
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          fee: poolKey.fee,
          tickSpacing: poolKey.tickSpacing,
          hooks: poolKey.hooks,
        },
        created_at: new Date().toISOString(),
      })

      console.log(`[V4 MM] Trade recorded: ${action} ${formatUnits(amountIn, 18)} -> ${formatUnits(amountOut, 18)}`)
    } catch (error) {
      console.error("[V4 MM] Error recording trade:", error)
    }
  }
}
