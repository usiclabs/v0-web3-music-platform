import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Check if there's any config (for backward compatibility)
      const { data: config } = await supabase.from("stream_to_earn_config").select("*").limit(1).single()

      if (!config) {
        return NextResponse.json(
          {
            error: "Stream-to-Earn config not found. Initialize from the admin panel.",
            initialized: false,
          },
          { status: 404 },
        )
      }

      return NextResponse.json({
        config: {
          ...config,
          rewards_wallet_private_key_encrypted: undefined,
        },
        initialized: true,
      })
    }

    const { data: config } = await supabase
      .from("stream_to_earn_config")
      .select("*")
      .eq("admin_address", user.id)
      .maybeSingle()

    if (!config) {
      return NextResponse.json(
        {
          error: "Stream-to-Earn config not found. Initialize from the admin panel.",
          initialized: false,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      config: {
        ...config,
        rewards_wallet_private_key_encrypted: undefined,
      },
      initialized: true,
    })
  } catch (error) {
    console.error("[v0] Error fetching stream-to-earn config:", error)
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // The system will create a single shared config if user is not authenticated

    const {
      rewards_wallet_address,
      usi_token_address,
      reward_amount_per_unlock,
      auto_distribute_enabled,
      min_balance_threshold,
    } = await request.json()

    if (!rewards_wallet_address || !usi_token_address || reward_amount_per_unlock === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adminAddress = user?.id || null

    const { data: existingConfig } = await supabase
      .from("stream_to_earn_config")
      .select("id")
      .eq("admin_address", adminAddress)
      .maybeSingle()

    let result
    if (existingConfig) {
      const { data, error } = await supabase
        .from("stream_to_earn_config")
        .update({
          rewards_wallet_address,
          usi_token_address,
          reward_amount_per_unlock,
          auto_distribute_enabled,
          min_balance_threshold,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConfig.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from("stream_to_earn_config")
        .insert({
          admin_address: adminAddress,
          rewards_wallet_address,
          usi_token_address,
          reward_amount_per_unlock,
          auto_distribute_enabled,
          min_balance_threshold,
        })
        .select()
        .single()

      if (error) throw error
      result = data

      await supabase.from("stream_to_earn_activity").insert({
        admin_address: adminAddress,
        activity_type: "config_updated",
        description: "Initialized stream-to-earn configuration",
        metadata: {
          rewards_wallet_address,
          usi_token_address,
          reward_amount_per_unlock,
        },
      })
    }

    return NextResponse.json({
      success: true,
      config: {
        ...result,
        rewards_wallet_private_key_encrypted: undefined,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating stream-to-earn config:", error)
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
  }
}
