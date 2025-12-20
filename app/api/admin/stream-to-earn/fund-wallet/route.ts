import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { amount_usi, amount_eth } = await request.json()

    if ((amount_usi === undefined || amount_usi <= 0) && (amount_eth === undefined || amount_eth <= 0)) {
      return NextResponse.json({ error: "Must provide either amount_usi or amount_eth" }, { status: 400 })
    }

    const adminAddress = user?.id
    const query = supabase.from("stream_to_earn_config").select("*")

    if (adminAddress) {
      query.eq("admin_address", adminAddress)
    } else {
      query.limit(1)
    }

    const { data: config } = await query.maybeSingle()

    if (!config) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 })
    }

    const updatedConfig = {
      usi_balance: (config.usi_balance || 0) + (amount_usi || 0),
      eth_gas_reserve_balance: (config.eth_gas_reserve_balance || 0) + (amount_eth || 0),
    }

    const { data: result, error } = await supabase
      .from("stream_to_earn_config")
      .update(updatedConfig)
      .eq("id", config.id)
      .select()
      .single()

    if (error) throw error

    await supabase.from("stream_to_earn_activity").insert({
      admin_address: adminAddress || "unknown",
      activity_type: "wallet_funded",
      description: `Funded wallet with ${amount_usi || 0} USI and ${amount_eth || 0} ETH`,
      metadata: { amount_usi, amount_eth },
    })

    return NextResponse.json({
      success: true,
      config: {
        ...result,
        rewards_wallet_private_key_encrypted: undefined,
      },
    })
  } catch (error) {
    console.error("[v0] Error funding wallet:", error)
    return NextResponse.json({ error: "Failed to fund wallet" }, { status: 500 })
  }
}
