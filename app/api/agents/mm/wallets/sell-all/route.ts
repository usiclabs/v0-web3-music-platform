import { type NextRequest, NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"
import { privateKeyToAccount } from "viem/accounts"

export async function POST(req: NextRequest) {
  try {
    const { agentId, walletNumber, ownerAddress } = await req.json()

    if (!agentId || walletNumber === undefined || !ownerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[API] Sell all request for agent ${agentId}, wallet ${walletNumber}`)

    const supabase = createAdminClient()

    // Get the MM agent
    const { data: agent, error: agentError } = await supabase.from("mm_agents").select("*").eq("id", agentId).single()

    if (agentError || !agent) {
      console.error("[API] Agent not found:", agentError)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (agent.owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error("[API] Unauthorized: owner mismatch")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate wallet number is in valid range (1-5)
    if (walletNumber < 1 || walletNumber > 5) {
      console.error(`[API] Invalid wallet number: ${walletNumber}`)
      return NextResponse.json({ error: "Invalid wallet number. Must be between 1 and 5." }, { status: 400 })
    }

    const keyMap = await getAgentWalletKeys(agent.id, ownerAddress)
    const privateKey = keyMap.get(walletNumber)

    if (!privateKey) {
      console.error(`[API] Wallet ${walletNumber} not found in keyMap`)
      return NextResponse.json({ error: `Wallet ${walletNumber} not found` }, { status: 404 })
    }

    const formattedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`)
    const wallet = privateKeyToAccount(formattedKey)

    console.log(`[API] Executing sell all for wallet ${wallet.address}`)

    // Create service instance
    const service = new MarketMakerAgentService(agent.id)

    // Execute sell (the executeSell already sells 50% of balance)
    // We'll call it twice to sell all
    const firstSell = await service.executeSell(wallet)

    if (!firstSell.success) {
      console.error("[API] First sell failed:", firstSell.error)
      return NextResponse.json(
        {
          error: firstSell.error || "Failed to sell tokens",
          partialSuccess: false,
        },
        { status: 500 },
      )
    }

    // Wait a bit before second sell
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Sell remaining 50%
    const secondSell = await service.executeSell(wallet)

    if (!secondSell.success) {
      console.log("[API] Second sell failed, but first succeeded:", secondSell.error)
      return NextResponse.json({
        success: true,
        partialSuccess: true,
        message: "Sold 50% of tokens successfully",
        txHash: firstSell.txHash,
      })
    }

    console.log(`[API] Sell all completed successfully`)

    return NextResponse.json({
      success: true,
      message: "All tokens sold successfully",
      txHashes: [firstSell.txHash, secondSell.txHash],
    })
  } catch (error: any) {
    console.error("[API] Sell all failed:", error)
    return NextResponse.json({ error: error.message || "Failed to sell tokens" }, { status: 500 })
  }
}
