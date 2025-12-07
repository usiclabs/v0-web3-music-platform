import { getAgentWalletService, type AgentWalletService } from "./wallet-service"
import { createClient } from "@/lib/supabase/server"
import { formatUnits, type Address, parseEther, parseUnits } from "viem"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import {
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  ERC20_ABI,
} from "@/lib/web3/contracts"
import { getAgentWalletKeys, generateWalletsForAgent } from "./wallet-generator"

const USI_TOKEN_ADDRESS = "0x987603A52d8B966E10FBD29DcB1A574049E25B07" as Address
const USI_TOKEN_SYMBOL = "USI"
const USI_TOKEN_NAME = "Universal Sound Index"

const BUY_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const SELL_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address // Base WETH
const WETH_ABI = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const BASE_RPC_ENDPOINTS = [
  "https://base-rpc.publicnode.com", // More reliable than mainnet.base.org
  "https://base.blockpi.network/v1/rpc/public",
  "https://1rpc.io/base",
  "https://mainnet.base.org",
]

let currentRpcIndex = 0
let rpcFailureCount = 0
const MAX_FAILURES_BEFORE_ROTATION = 3

function getRpcUrl(): string {
  // Rotate to next RPC if current one is failing
  if (rpcFailureCount >= MAX_FAILURES_BEFORE_ROTATION) {
    currentRpcIndex = (currentRpcIndex + 1) % BASE_RPC_ENDPOINTS.length
    rpcFailureCount = 0
    console.log(`[MM Agent] Rotating to RPC endpoint ${currentRpcIndex + 1}/${BASE_RPC_ENDPOINTS.length}`)
  }

  return BASE_RPC_ENDPOINTS[currentRpcIndex]
}

function handleRpcError(error: any) {
  // Check if error is rate limiting
  if (error?.message?.includes("rate limit") || error?.message?.includes("429")) {
    rpcFailureCount++
    console.log(`[MM Agent] RPC rate limit hit (${rpcFailureCount}/${MAX_FAILURES_BEFORE_ROTATION})`)
  }
}

export interface MMAgentConfig {
  id: string
  wallet_address: string
  is_active: boolean
  buy_amount_eth: string
  buy_interval_minutes: number
  sell_interval_minutes: number
  last_buy_at: string | null
  last_sell_at: string | null
  total_volume_generated: string
  multi_wallet_mode?: boolean
  active_wallets?: number
  owner_address?: string
  token_address?: string
  token_symbol?: string
}

export interface MMAgentStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: string
  usiBalance: string
  walletStats?: {
    address: string
    buys: number
    sells: number
    usiBalance: string
  }[]
}

/**
 * Market Maker Agent Service
 * Automatically buys and sells $USI tokens to generate healthy ecosystem volume
 */
export class MarketMakerAgentService {
  private walletService: AgentWalletService
  private agentId: string
  private ownerAddress: string | null = null
  private _walletKeys: Map<number, string> = new Map()
  private _walletAccounts: Map<number, any> = new Map()
  private _currentWalletIndex = 0

  constructor(agentId: string, ownerAddress?: string) {
    this.walletService = getAgentWalletService()
    this.agentId = agentId
    this.ownerAddress = ownerAddress || null
  }

  private async loadWalletKeys(): Promise<void> {
    if (this._walletKeys.size > 0) return // Already loaded

    if (!this.ownerAddress) {
      // Fetch owner address from agent
      const supabase = await createClient()
      const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", this.agentId).single()

      if (!agent?.owner_address) {
        throw new Error("Agent owner address not found")
      }
      this.ownerAddress = agent.owner_address
    }

    // Load encrypted keys from database
    this._walletKeys = await getAgentWalletKeys(this.agentId, this.ownerAddress)

    if (this._walletKeys.size === 0) {
      console.log(`[MM Agent] No wallets found for agent ${this.agentId}, generating now...`)
      await generateWalletsForAgent(this.agentId, this.ownerAddress)
      this._walletKeys = await getAgentWalletKeys(this.agentId, this.ownerAddress)
    }

    console.log(`[MM Agent] Loaded ${this._walletKeys.size} wallet keys for agent ${this.agentId}`)
  }

  private async getWallet(walletIndex: number): Promise<any> {
    if (this._walletAccounts.has(walletIndex)) {
      return this._walletAccounts.get(walletIndex)
    }

    await this.loadWalletKeys()

    const privateKey = this._walletKeys.get(walletIndex)
    if (!privateKey) {
      throw new Error(`Wallet ${walletIndex} not found`)
    }

    const formattedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`)

    const account = privateKeyToAccount(formattedKey)
    this._walletAccounts.set(walletIndex, account)
    return account
  }

  private async getNextWallet(agent: any): Promise<any> {
    if (!agent.multi_wallet_mode) {
      // Single wallet mode - use wallet 1
      return await this.getWallet(1)
    }

    // Round-robin through active wallets
    this._currentWalletIndex = (this._currentWalletIndex % agent.active_wallets) + 1
    return await this.getWallet(this._currentWalletIndex)
  }

  /**
   * Get or create MM agent for a wallet address
   */
  static async getOrCreateByWallet(walletAddress: string): Promise<MMAgentConfig> {
    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from("mm_agents")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (fetchError) {
      console.error("[MM Agent] Error fetching agent:", fetchError)
      throw new Error(`Failed to fetch MM agent: ${fetchError.message}`)
    }

    if (existing) {
      return existing as MMAgentConfig
    }

    // Create new agent
    const { data: newAgent, error } = await supabase
      .from("mm_agents")
      .insert({
        wallet_address: walletAddress,
        is_active: false,
        buy_amount_eth: "0.0001",
        buy_interval_minutes: 5,
        sell_interval_minutes: 10,
      })
      .select()
      .single()

    if (error) {
      console.error("[MM Agent] Error creating agent:", error)
      throw new Error(`Failed to create MM agent: ${error.message}`)
    }

    return newAgent as MMAgentConfig
  }

  /**
   * Check if it's time to buy based on interval
   */
  private shouldBuy(agent: MMAgentConfig, now: Date): boolean {
    if (!agent.last_buy_at) return true
    const lastBuy = new Date(agent.last_buy_at).getTime()
    const intervalMs = agent.buy_interval_minutes * 60 * 1000
    return now.getTime() - lastBuy >= intervalMs
  }

  /**
   * Check if it's time to sell based on interval
   */
  private shouldSell(agent: MMAgentConfig, now: Date): boolean {
    if (!agent.last_sell_at) return true
    const lastSell = new Date(agent.last_sell_at).getTime()
    const intervalMs = agent.sell_interval_minutes * 60 * 1000
    return now.getTime() - lastSell >= intervalMs
  }

  /**
   * Execute a buy operation - swap ETH/WETH for USI
   * Enhanced to support buying with both ETH and WETH
   */
  async executeBuy(walletIndex: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log("[MM Agent] Attempting to buy $USI...")

      const wallet = await this.getWallet(walletIndex)
      const { publicClient, walletClient, rpcUrl } = await this.createClients(wallet)

      const routerAddress = UNISWAP_V3_ROUTER[base.id as keyof typeof UNISWAP_V3_ROUTER] as Address

      const supabase = await createClient()
      const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

      if (!agent) {
        throw new Error("Agent not found")
      }

      const configuredBuyAmount = parseEther(agent.buy_amount_eth)

      // Check ETH balance
      const ethBalance = await publicClient.getBalance({
        address: wallet.address,
      })

      console.log(`[MM Agent] Current ETH balance: ${formatUnits(ethBalance, 18)}`)
      console.log(`[MM Agent] Configured buy amount: ${agent.buy_amount_eth} ETH`)

      // Check WETH balance
      const wethBalance = (await publicClient.readContract({
        address: WETH_ADDRESS,
        abi: WETH_ABI,
        functionName: "balanceOf",
        args: [wallet.address],
      })) as bigint

      console.log(`[MM Agent] Current WETH balance: ${formatUnits(wethBalance, 18)}`)

      let buyAmount: bigint
      let useWETH = false

      if (wethBalance >= configuredBuyAmount) {
        buyAmount = wethBalance
        useWETH = true
        console.log(`[MM Agent] Using WETH for buy: ${formatUnits(buyAmount, 18)}`)
      } else if (ethBalance >= configuredBuyAmount * 2n) {
        // Need at least 2x buy amount (buy amount + gas)
        buyAmount = configuredBuyAmount
        console.log(`[MM Agent] Using ETH for buy: ${formatUnits(buyAmount, 18)}`)
      } else {
        const error = "Insufficient ETH/WETH balance for buy"
        console.error(`[MM Agent] ${error}`)
        await this.logActivity("buy_failed", error)
        return { success: false, error }
      }

      // Get quote for expected output with 5% slippage
      const expectedTokens = await this.getQuote(useWETH ? WETH_ADDRESS : WETH_ADDRESS, USI_TOKEN_ADDRESS, buyAmount)
      const minTokensOut = (expectedTokens * 95n) / 100n
      console.log(
        `[MM Agent] Expected $USI output: ${formatUnits(expectedTokens, 18)} (min: ${formatUnits(minTokensOut, 18)})`,
      )

      if (useWETH) {
        console.log(`[MM Agent] Checking WETH approval for router...`)
        await this.walletService.ensureApproval(WETH_ADDRESS, routerAddress, buyAmount)
      }

      // Execute the swap
      const feeTiers = [3000, 10000, 500]
      let buyTxHash: string | undefined
      let lastError = ""

      for (const fee of feeTiers) {
        try {
          console.log(`[MM Agent] Attempting buy with fee tier ${fee}`)

          if (useWETH) {
            const gasEstimate = await publicClient.estimateContractGas({
              address: routerAddress,
              abi: UNISWAP_V3_ROUTER_ABI,
              functionName: "exactInputSingle",
              args: [
                {
                  tokenIn: WETH_ADDRESS,
                  tokenOut: USI_TOKEN_ADDRESS,
                  fee,
                  recipient: wallet.address,
                  amountIn: buyAmount,
                  amountOutMinimum: minTokensOut,
                  sqrtPriceLimitX96: 0n,
                },
              ],
              account: wallet,
            })

            const gasLimit = (gasEstimate * 120n) / 100n
            const gasPrice = await publicClient.getGasPrice()

            const txHash = await walletClient.writeContract({
              address: routerAddress,
              abi: UNISWAP_V3_ROUTER_ABI,
              functionName: "exactInputSingle",
              args: [
                {
                  tokenIn: WETH_ADDRESS,
                  tokenOut: USI_TOKEN_ADDRESS,
                  fee,
                  recipient: wallet.address,
                  amountIn: buyAmount,
                  amountOutMinimum: minTokensOut,
                  sqrtPriceLimitX96: 0n,
                },
              ],
              gas: gasLimit,
              gasPrice: gasPrice,
            })

            console.log(`[MM Agent] Buy transaction (WETH) sent: ${txHash}`)
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

            if (receipt.status === "success") {
              console.log(`[MM Agent] Buy successful! TX: ${txHash}`)
              buyTxHash = txHash
              break
            }
          } else {
            const gasEstimate = await publicClient.estimateContractGas({
              address: routerAddress,
              abi: UNISWAP_V3_ROUTER_ABI,
              functionName: "exactInputSingle",
              args: [
                {
                  tokenIn: WETH_ADDRESS,
                  tokenOut: USI_TOKEN_ADDRESS,
                  fee,
                  recipient: wallet.address,
                  amountIn: buyAmount,
                  amountOutMinimum: minTokensOut,
                  sqrtPriceLimitX96: 0n,
                },
              ],
              account: wallet,
              value: buyAmount,
            })

            const gasLimit = (gasEstimate * 120n) / 100n
            const gasPrice = await publicClient.getGasPrice()

            const txHash = await walletClient.writeContract({
              address: routerAddress,
              abi: UNISWAP_V3_ROUTER_ABI,
              functionName: "exactInputSingle",
              args: [
                {
                  tokenIn: WETH_ADDRESS,
                  tokenOut: USI_TOKEN_ADDRESS,
                  fee,
                  recipient: wallet.address,
                  amountIn: buyAmount,
                  amountOutMinimum: minTokensOut,
                  sqrtPriceLimitX96: 0n,
                },
              ],
              value: buyAmount,
              gas: gasLimit,
              gasPrice: gasPrice,
            })

            console.log(`[MM Agent] Buy transaction (ETH) sent: ${txHash}`)
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

            if (receipt.status === "success") {
              console.log(`[MM Agent] Buy successful! TX: ${txHash}`)
              buyTxHash = txHash
              break
            }
          }
        } catch (error: any) {
          lastError = error.message || error.toString()
          console.log(`[MM Agent] Fee tier ${fee} failed: ${lastError}`)

          if (lastError.includes("insufficient funds")) {
            console.error(`[MM Agent] Insufficient funds for gas. Please fund the wallet.`)
            break
          }

          continue
        }
      }

      if (!buyTxHash) {
        const error = `All fee tiers failed. Last error: ${lastError}`
        console.error(`[MM Agent] Buy failed: ${error}`)
        await this.logActivity("buy_failed", error)
        return { success: false, error }
      }

      // Record the trade
      await this.recordTrade("buy", buyAmount, minTokensOut, buyTxHash)

      await this.logActivity("buy_executed", `Bought ${formatUnits(minTokensOut, 18)} $USI`, {
        txHash: buyTxHash,
        amountIn: formatUnits(buyAmount, 18),
        currency: useWETH ? "WETH" : "ETH",
        amountOut: formatUnits(minTokensOut, 18),
      })

      await this.updateLastBuyTime()

      return { success: true, txHash: buyTxHash }
    } catch (error: any) {
      console.error("[MM Agent] Buy execution error:", error)
      await this.logActivity("buy_error", error.message || "Unknown error during buy")
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Execute a sell operation - swap accumulated USI for ETH
   * Enhanced to unwrap WETH to ETH after selling
   */
  async executeSell(walletIndex: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
    let wallet: any

    try {
      console.log("[MM Agent] Attempting to sell accumulated $USI...")

      wallet = await this.getWallet(walletIndex)
      const { publicClient, walletClient, rpcUrl } = await this.createClients(wallet)

      const routerAddress = UNISWAP_V3_ROUTER[base.id as keyof typeof UNISWAP_V3_ROUTER] as Address

      const usiBalance = await publicClient.readContract({
        address: USI_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet.address],
      })

      console.log(`[v0] Raw balance from contract: ${usiBalance.toString()}`)

      if (usiBalance === 0n) {
        console.log(`[MM Agent] No $USI tokens to sell`)
        return { success: false, error: "No tokens to sell" }
      }

      const sellAmount = usiBalance / 2n
      console.log(`[MM Agent] Total balance: ${formatUnits(usiBalance, 18)} $USI`)
      console.log(`[MM Agent] Selling 50%: ${formatUnits(sellAmount, 18)} $USI`)

      if (sellAmount < parseUnits("1", 18)) {
        console.log(`[MM Agent] Sell amount too small, need at least 1 $USI`)
        return { success: false, error: "Sell amount too small" }
      }

      // Estimate output with 5% slippage
      const minEthOut = await this.getQuote(USI_TOKEN_ADDRESS, WETH_ADDRESS, sellAmount)
      const minEthOutWithSlippage = (minEthOut * 95n) / 100n
      console.log(
        `[MM Agent] Expected WETH output: ${formatUnits(minEthOut, 18)} (min: ${formatUnits(minEthOutWithSlippage, 18)})`,
      )

      console.log(`[MM Agent] Checking approval for router...`)
      const currentAllowance = await publicClient.readContract({
        address: USI_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address, routerAddress],
      })

      console.log(`[v0] Current allowance: ${formatUnits(currentAllowance as bigint, 18)} $USI`)

      if ((currentAllowance as bigint) < sellAmount) {
        console.log(`[MM Agent] Insufficient allowance, approving ${formatUnits(sellAmount, 18)} $USI`)

        const approvalAmount = sellAmount * 2n // Approve 2x for future trades
        const approveHash = await walletClient.writeContract({
          address: USI_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [routerAddress, approvalAmount],
        })

        console.log(`[MM Agent] Approval transaction sent: ${approveHash}`)
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log(`[MM Agent] Approval confirmed, proceeding with swap...`)
      }

      const feeTiers = [3000, 10000, 500]
      let sellTxHash: string | undefined
      let lastError = ""

      for (const fee of feeTiers) {
        try {
          console.log(`[MM Agent] Attempting sell with fee tier ${fee}`)

          const gasEstimate = await publicClient.estimateContractGas({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: USI_TOKEN_ADDRESS,
                tokenOut: WETH_ADDRESS,
                fee,
                recipient: wallet.address,
                amountIn: sellAmount, // Use validated sellAmount instead of full balance
                amountOutMinimum: minEthOutWithSlippage,
                sqrtPriceLimitX96: 0n,
              },
            ],
            account: wallet,
          })

          const gasLimit = (gasEstimate * 120n) / 100n
          console.log(`[MM Agent] Gas estimate: ${gasEstimate}, using limit: ${gasLimit}`)

          const gasPrice = await publicClient.getGasPrice()
          console.log(`[MM Agent] Current gas price: ${formatUnits(gasPrice, 9)} gwei`)

          const txHash = await walletClient.writeContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: USI_TOKEN_ADDRESS,
                tokenOut: WETH_ADDRESS,
                fee,
                recipient: wallet.address,
                amountIn: sellAmount, // Use validated sellAmount
                amountOutMinimum: minEthOutWithSlippage,
                sqrtPriceLimitX96: 0n,
              },
            ],
            gas: gasLimit,
            gasPrice: gasPrice,
          })

          console.log(`[MM Agent] Sell transaction sent: ${txHash}`)

          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Sell successful! TX: ${txHash}`)
            sellTxHash = txHash
            break
          } else {
            lastError = `Transaction reverted for fee tier ${fee}`
            console.log(`[MM Agent] ${lastError}`)
          }
        } catch (error: any) {
          lastError = error.message || error.toString()
          console.log(`[MM Agent] Fee tier ${fee} failed: ${lastError}`)

          if (lastError.includes("insufficient funds")) {
            console.error(`[MM Agent] Insufficient funds for gas. Please fund the wallet.`)
            break // No point trying other fee tiers
          }

          continue
        }
      }

      if (!sellTxHash) {
        const error = `All fee tiers failed. Last error: ${lastError}`
        console.error(`[MM Agent] Sell failed: ${error}`)
        await this.logActivity("sell_failed", error)
        return { success: false, error }
      }

      try {
        console.log(`[MM Agent] Unwrapping WETH to ETH...`)

        const wethBalance = (await publicClient.readContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "balanceOf",
          args: [wallet.address],
        })) as bigint

        if (wethBalance > 0n) {
          const unwrapGasEstimate = await publicClient.estimateContractGas({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: "withdraw",
            args: [wethBalance],
            account: wallet,
          })

          const unwrapGasLimit = (unwrapGasEstimate * 120n) / 100n
          const gasPrice = await publicClient.getGasPrice()

          const unwrapTxHash = await walletClient.writeContract({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: "withdraw",
            args: [wethBalance],
            gas: unwrapGasLimit,
            gasPrice: gasPrice,
          })

          console.log(`[MM Agent] Unwrap transaction sent: ${unwrapTxHash}`)

          const unwrapReceipt = await publicClient.waitForTransactionReceipt({ hash: unwrapTxHash })

          if (unwrapReceipt.status === "success") {
            console.log(`[MM Agent] Successfully unwrapped ${formatUnits(wethBalance, 18)} WETH to ETH`)
          }
        }
      } catch (error: any) {
        console.log(`[MM Agent] Warning: Failed to unwrap WETH: ${error.message}`)
        // Continue anyway, the sell was successful
      }

      // Record the trade
      await this.recordTrade("sell", sellAmount, minEthOutWithSlippage, sellTxHash)

      // Log success
      await this.logActivity(
        "sell_executed",
        `Sold ${formatUnits(sellAmount, 18)} $USI for ${formatUnits(minEthOutWithSlippage, 18)} ETH`,
        {
          txHash: sellTxHash,
          amountIn: formatUnits(sellAmount, 18),
          amountOut: formatUnits(minEthOutWithSlippage, 18),
        },
      )

      // Update last sell time
      await this.updateLastSellTime()

      return { success: true, txHash: sellTxHash }
    } catch (error: any) {
      console.error("[MM Agent] Sell execution error:", error.message)
      await this.logActivity("error", `Sell failed: ${error.message}`, {
        wallet: wallet?.address || "unknown",
      })
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Run a market making cycle (check and execute buy/sell if needed)
   */
  async runCycle(forceBuy?: boolean, forceSell?: boolean): Promise<MMCycleResult> {
    const supabase = await createClient()

    const result: MMCycleResult = {
      buyExecuted: false,
      sellExecuted: false,
      messages: [],
    }

    const { data: agent, error } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

    if (error || !agent || !agent.is_active) {
      throw new Error("Agent not found or inactive")
    }

    const now = new Date()

    // Determine which wallet to use
    const walletAccount = await this.getNextWallet(agent)
    const walletAddress = walletAccount.address

    console.log(`[MM Agent] Running cycle with wallet ${walletAddress} (multi-wallet: ${agent.multi_wallet_mode})`)
    result.messages.push(`Using wallet ${walletAddress}`)

    // Buy logic
    if (forceBuy || this.shouldBuy(agent, now)) {
      try {
        const buyResult = await this.executeBuy(1)

        if (buyResult.success) {
          await supabase.from("mm_agents").update({ last_buy_at: now.toISOString() }).eq("id", this.agentId)

          // Update wallet stats
          if (agent.multi_wallet_mode) {
            await supabase
              .from("mm_agent_wallets")
              .update({
                total_buys: supabase.rpc("increment", { x: 1 }),
                last_used_at: now.toISOString(),
              })
              .eq("agent_id", this.agentId)
              .eq("wallet_address", walletAddress)
          }

          await this.logActivity("buy", "Buy executed successfully", {
            amount: agent.buy_amount_eth,
            wallet: walletAddress,
          })

          result.buyExecuted = true
          result.messages.push(`Buy executed: ${agent.buy_amount_eth} ETH`)
        } else {
          result.messages.push(`Buy failed: ${buyResult.error}`)
        }
      } catch (error: any) {
        console.error("[MM Agent] Buy failed:", error.message)
        await this.logActivity("error", `Buy failed: ${error.message}`, {
          wallet: walletAddress,
        })
        result.messages.push(`Buy failed: ${error.message}`)
      }
    }

    // Sell logic
    if (forceSell || this.shouldSell(agent, now)) {
      try {
        const sellResult = await this.executeSell(1)

        if (sellResult.success) {
          await supabase.from("mm_agents").update({ last_sell_at: now.toISOString() }).eq("id", this.agentId)

          // Update wallet stats
          if (agent.multi_wallet_mode) {
            await supabase
              .from("mm_agent_wallets")
              .update({
                total_sells: supabase.rpc("increment", { x: 1 }),
                last_used_at: now.toISOString(),
              })
              .eq("agent_id", this.agentId)
              .eq("wallet_address", walletAddress)
          }

          await this.logActivity("sell", "Sell executed successfully", {
            wallet: walletAddress,
          })

          result.sellExecuted = true
          result.messages.push("Sell executed successfully")
        } else {
          result.messages.push(`Sell failed: ${sellResult.error}`)
        }
      } catch (error: any) {
        console.error("[MM Agent] Sell failed:", error.message)
        await this.logActivity("error", `Sell failed: ${error.message}`, {
          wallet: walletAddress,
        })
        result.messages.push(`Sell failed: ${error.message}`)
      }
    }

    await this.logActivity("cycle_complete", "Market making cycle completed", {
      wallet: walletAddress,
    })
    result.messages.push("Cycle completed")

    return result
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<MMAgentStats> {
    const supabase = await createClient()

    const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

    if (!agent) {
      return {
        totalBuys: 0,
        totalSells: 0,
        volumeGenerated: "0",
        usiBalance: "0",
      }
    }

    const { data: activities } = await supabase
      .from("mm_agent_activity")
      .select("activity_type")
      .eq("agent_id", this.agentId)

    const totalBuys = activities?.filter((a) => a.activity_type === "buy").length || 0
    const totalSells = activities?.filter((a) => a.activity_type === "sell").length || 0

    let walletStats = undefined
    if (agent.multi_wallet_mode) {
      const { data: wallets } = await supabase
        .from("mm_agent_wallets")
        .select("*")
        .eq("agent_id", this.agentId)
        .eq("is_active", true)
        .order("wallet_index")

      if (wallets) {
        walletStats = await Promise.all(
          wallets.map(async (wallet) => {
            const balance = await this.getTokenBalance(wallet.wallet_address as Address)
            return {
              address: wallet.wallet_address,
              buys: wallet.total_buys,
              sells: wallet.total_sells,
              usiBalance: balance,
            }
          }),
        )
      }
    }

    const usiBalance = await this.getTokenBalance(agent.multi_wallet_mode ? undefined : await this.getWallet(1).address)

    return {
      totalBuys,
      totalSells,
      volumeGenerated: agent.total_volume_generated?.toString() || "0",
      usiBalance,
      walletStats,
    }
  }

  /**
   * Helper methods
   */
  private async logActivity(activityType: string, description: string, metadata?: any): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agent_activity").insert({
      agent_id: this.agentId,
      activity_type: activityType,
      description,
      metadata,
      wallet_address: metadata?.wallet || null,
    })
  }

  private async updateLastBuyTime(): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agents").update({ last_buy_at: new Date().toISOString() }).eq("id", this.agentId)
  }

  private async updateLastSellTime(): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agents").update({ last_sell_at: new Date().toISOString() }).eq("id", this.agentId)
  }

  private async checkPoolExists(
    publicClient: any,
    tokenAddress: Address,
    chainId: number,
  ): Promise<{ exists: boolean; fee?: number }> {
    try {
      const factoryAddress = UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as Address
      const WETH_ADDRESS =
        chainId === 8453
          ? ("0x4200000000000000000000000000000000000006" as Address)
          : ("0x4200000000000000000000000000000000000006" as Address)

      const [token0, token1] =
        tokenAddress.toLowerCase() < WETH_ADDRESS.toLowerCase()
          ? [tokenAddress, WETH_ADDRESS]
          : [WETH_ADDRESS, tokenAddress]

      const feeTiers = [3000, 10000, 500, 100]

      for (const fee of feeTiers) {
        try {
          const poolAddress = (await publicClient.readContract({
            address: factoryAddress,
            abi: UNISWAP_V3_FACTORY_ABI,
            functionName: "getPool",
            args: [token0, token1, fee],
          })) as Address

          if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
            return { exists: true, fee }
          }
        } catch {
          continue
        }
      }

      return { exists: false }
    } catch (error) {
      console.error("[MM Agent] Error checking pool:", error)
      return { exists: false }
    }
  }

  private async getQuote(tokenIn: Address, tokenOut: Address, amountIn: bigint): Promise<bigint> {
    try {
      const quoterAddress = UNISWAP_V3_QUOTER[base.id as keyof typeof UNISWAP_V3_QUOTER] as Address

      const feeTiers = [3000, 10000, 500]

      for (const fee of feeTiers) {
        try {
          const rpcUrl = getRpcUrl()

          const publicClient = createPublicClient({
            chain: base,
            transport: http(rpcUrl),
          })

          const result = await publicClient.readContract({
            address: quoterAddress,
            abi: UNISWAP_V3_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [
              {
                tokenIn,
                tokenOut,
                amountIn,
                fee,
                sqrtPriceLimitX96: 0n,
              },
            ],
          })

          const amountOut = (result as [bigint, bigint, number, bigint])[0]

          if (amountOut > 0n) {
            return amountOut
          }
        } catch {
          continue
        }
      }

      throw new Error("Failed to get quote")
    } catch (error) {
      console.error("[MM Agent] Failed to get quote:", error)
      throw error
    }
  }

  private async recordTrade(
    tradeType: "buy" | "sell",
    amountIn: bigint,
    amountOut: bigint,
    txHash: string,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Update volume in mm_agents table
      const { data: agent } = await supabase
        .from("mm_agents")
        .select("total_volume_generated")
        .eq("id", this.agentId)
        .single()

      if (agent) {
        const volumeEth = tradeType === "buy" ? Number(formatUnits(amountIn, 18)) : Number(formatUnits(amountOut, 18))

        const newVolume = Number(agent.total_volume_generated || 0) + volumeEth

        await supabase
          .from("mm_agents")
          .update({
            total_volume_generated: newVolume,
            updated_at: new Date().toISOString(),
          })
          .eq("id", this.agentId)
      }

      console.log(`[MM Agent] Recorded ${tradeType} trade: ${txHash}`)
    } catch (error) {
      console.error("[MM Agent] Failed to record trade:", error)
    }
  }

  private async getTokenBalance(address?: Address): Promise<string> {
    if (!address) {
      // Get combined balance from all wallets
      const supabase = await createClient()
      const { data: wallets } = await supabase
        .from("mm_agent_wallets")
        .select("wallet_address")
        .eq("agent_id", this.agentId)
        .eq("is_active", true)

      if (!wallets || wallets.length === 0) return "0"

      const rpcUrl = "https://mainnet.base.org"
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      let totalBalance = 0n
      for (const wallet of wallets) {
        const balance = await publicClient.readContract({
          address: USI_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wallet.wallet_address as Address],
        })
        totalBalance += balance as bigint
      }

      return formatUnits(totalBalance, 18)
    }

    const rpcUrl = getRpcUrl()
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const balance = await publicClient.readContract({
      address: USI_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    })

    return formatUnits(balance as bigint, 18)
  }

  /**
   * Get or create MM agent for a user
   */
  static async getOrCreateByOwner(ownerAddress: string): Promise<MMAgentConfig> {
    const supabase = await createClient()

    const { data: agent, error } = await supabase
      .from("mm_agents")
      .select("*")
      .eq("owner_address", ownerAddress)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch MM agent: ${error.message}`)
    }

    if (agent) {
      return agent as MMAgentConfig
    }

    // Agent doesn't exist - user needs to create one via /api/agents/mm/create
    throw new Error("MM agent not found. Please create one first.")
  }

  private async createClients(wallet: any) {
    const rpcUrl = getRpcUrl()

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl, {
        batch: {
          wait: 50, // Batch requests within 50ms
        },
        retryCount: 3,
        retryDelay: 1000,
      }),
      cacheTime: 4000, // Cache for 4 seconds
    })

    const walletClient = createWalletClient({
      chain: base,
      transport: http(rpcUrl, {
        batch: {
          wait: 50,
        },
        retryCount: 3,
        retryDelay: 1000,
      }),
      account: wallet,
    })

    return { publicClient, walletClient, rpcUrl }
  }

  private async initializeAgent(ownerAddress: Address, tokenAddress: Address, tokenSymbol: string) {
    const supabase = await createClient()

    const { data: existingWallet } = await supabase
      .from("server_wallets")
      .select("*")
      .eq("owner_address", ownerAddress)
      .single()

    let walletAddress: string

    if (existingWallet) {
      walletAddress = existingWallet.wallet_address
    } else {
      const newWallet = this.walletService.generateWallet()
      walletAddress = newWallet.address

      await supabase.from("server_wallets").insert({
        owner_address: ownerAddress,
        wallet_address: walletAddress,
        encrypted_private_key: this.walletService.encryptPrivateKey(newWallet.privateKey),
      })
    }

    const defaultBuyAmountEth = "0.0001"

    await supabase.from("mm_agents").insert({
      owner_address: ownerAddress,
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      wallet_address: walletAddress,
      is_active: false,
      buy_amount_eth: defaultBuyAmountEth,
      buy_interval_minutes: 5,
      sell_interval_minutes: 10,
    })
  }
}

interface MMCycleResult {
  buyExecuted: boolean
  sellExecuted: boolean
  messages: string[]
}

const SELL_PERCENTAGE = 0.5 // Sell 50% of balance
