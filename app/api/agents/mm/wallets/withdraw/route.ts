import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"
import { createWalletClient, createPublicClient, http, formatEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base } from "viem/chains"
import { ERC20_ABI } from "@/lib/web3/contracts"

const USI_TOKEN = "0x987603A52d8B966E10FBD29DcB1A574049E25B07"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, walletIndex, recipientAddress, ownerAddress, withdrawType } = body

    if (!agentId || !walletIndex || !recipientAddress || !ownerAddress || !withdrawType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", agentId).single()

    if (!agent || agent.owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the wallet's private key
    const keyMap = await getAgentWalletKeys(agentId, ownerAddress)
    const privateKey = keyMap.get(walletIndex)

    if (!privateKey) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)

    const publicClient = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
    })

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
    })

    let txHash: string

    if (withdrawType === "eth") {
      // Get ETH balance
      const balance = await publicClient.getBalance({ address: account.address })
      // Estimate gas
      const gasPrice = await publicClient.getGasPrice()
      const gasLimit = 21000n
      const gasCost = gasPrice * gasLimit

      // Withdraw all ETH minus gas
      const amountToSend = balance - gasCost

      if (amountToSend <= 0n) {
        return NextResponse.json({ error: "Insufficient balance to cover gas" }, { status: 400 })
      }

      txHash = await walletClient.sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: amountToSend,
      })

      console.log(`[API] Withdrew ${formatEther(amountToSend)} ETH from wallet ${walletIndex}. TX: ${txHash}`)
    } else if (withdrawType === "usi") {
      // Get USI balance
      const balance = (await publicClient.readContract({
        address: USI_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint

      if (balance <= 0n) {
        return NextResponse.json({ error: "No USI balance to withdraw" }, { status: 400 })
      }

      // Transfer all USI
      txHash = await walletClient.writeContract({
        address: USI_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientAddress, balance],
      })

      console.log(`[API] Withdrew ${formatEther(balance)} USI from wallet ${walletIndex}. TX: ${txHash}`)
    } else {
      return NextResponse.json({ error: "Invalid withdraw type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, txHash })
  } catch (error: any) {
    console.error("[API] Withdraw failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
