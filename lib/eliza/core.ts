import { createClient } from "@/lib/supabase/server"
import { generateWalletsForAgent, getAgentWalletKeys } from "@/lib/agents/wallet-generator"
import type { ElizaAgentConfig, ElizaAction, AgentPlugin, AgentContext } from "./types"

/**
 * Eliza Agent Service - Core agent runtime
 * Manages agent lifecycle, memory, and action execution
 */
export class ElizaAgentService {
  private agentId: string
  private config: ElizaAgentConfig | null = null
  private plugins: Map<string, AgentPlugin> = new Map()
  private _walletKey: string | null = null

  constructor(agentId: string) {
    this.agentId = agentId
  }

  /**
   * Initialize agent and load configuration
   */
  async initialize(): Promise<void> {
    const supabase = await createClient()
    const { data: agent } = await supabase.from("eliza_agents").select("*").eq("id", this.agentId).single()

    if (!agent) {
      throw new Error("Agent not found")
    }

    this.config = agent

    // Load wallet if exists
    if (agent.owner_address) {
      const walletKeys = await getAgentWalletKeys(this.agentId, agent.owner_address)
      this._walletKey = walletKeys.get(1) || null
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: AgentPlugin): void {
    this.plugins.set(plugin.name, plugin)
    console.log(`[Eliza] Registered plugin: ${plugin.name}`)
  }

  /**
   * Get agent context
   */
  private async getContext(): Promise<AgentContext> {
    const supabase = await createClient()

    // Get recent memories
    const { data: memories } = await supabase
      .from("eliza_memory")
      .select("*")
      .eq("agent_id", this.agentId)
      .order("importance", { ascending: false })
      .order("timestamp", { ascending: false })
      .limit(100)

    // Get recent actions
    const { data: actions } = await supabase
      .from("eliza_actions")
      .select("*")
      .eq("agent_id", this.agentId)
      .order("created_at", { ascending: false })
      .limit(50)

    return {
      agentId: this.agentId,
      ownerAddress: this.config!.owner_address,
      memory: memories || [],
      recentActions: actions || [],
      walletAddress: this.config!.wallet_address,
    }
  }

  /**
   * Store memory
   */
  async addMemory(content: string, importance: number, metadata: Record<string, any> = {}): Promise<void> {
    const supabase = await createClient()
    await supabase.from("eliza_memory").insert({
      agent_id: this.agentId,
      content,
      importance,
      metadata,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Execute an action
   */
  async executeAction(actionType: string, target: string, parameters: Record<string, any>): Promise<ElizaAction> {
    const supabase = await createClient()

    // Create action record
    const { data: action, error } = await supabase
      .from("eliza_actions")
      .insert({
        agent_id: this.agentId,
        action_type: actionType,
        target,
        parameters,
        status: "pending",
      })
      .select()
      .single()

    if (error || !action) {
      throw new Error(`Failed to create action: ${error?.message}`)
    }

    try {
      // Update status to executing
      await supabase.from("eliza_actions").update({ status: "executing" }).eq("id", action.id)

      // Find plugin that handles this action
      const context = await this.getContext()
      let result: any = null

      for (const plugin of this.plugins.values()) {
        const pluginAction = plugin.actions.find((a) => a.name === actionType || a.similes.includes(actionType))

        if (pluginAction) {
          // Validate parameters
          if (!pluginAction.validate(parameters)) {
            throw new Error(`Invalid parameters for action: ${actionType}`)
          }

          // Execute action
          result = await pluginAction.handler(parameters, context)
          break
        }
      }

      if (result === null) {
        throw new Error(`No plugin found to handle action: ${actionType}`)
      }

      // Update action with result
      await supabase
        .from("eliza_actions")
        .update({
          status: "completed",
          result: JSON.stringify(result),
          completed_at: new Date().toISOString(),
        })
        .eq("id", action.id)

      // Add memory of the action
      await this.addMemory(`Executed ${actionType} on ${target}`, 5, { actionId: action.id, result })

      return { ...action, status: "completed", result: JSON.stringify(result) }
    } catch (error: any) {
      // Update action with error
      await supabase
        .from("eliza_actions")
        .update({
          status: "failed",
          error: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", action.id)

      throw error
    }
  }

  /**
   * Run agent cycle - evaluate environment and decide on actions
   */
  async runCycle(): Promise<void> {
    if (!this.config || !this.config.is_active) {
      return
    }

    console.log(`[Eliza] Running cycle for agent ${this.agentId}`)

    const context = await this.getContext()

    // Run all evaluators from plugins
    const evaluations: { plugin: string; score: number }[] = []

    for (const plugin of this.plugins.values()) {
      for (const evaluator of plugin.evaluators) {
        try {
          const score = await evaluator.evaluate(context)
          evaluations.push({ plugin: plugin.name, score })
        } catch (error) {
          console.error(`[Eliza] Evaluator ${evaluator.name} failed:`, error)
        }
      }
    }

    // Sort evaluations by score
    evaluations.sort((a, b) => b.score - a.score)

    console.log(`[Eliza] Evaluations:`, evaluations)

    // Execute highest scoring action (if score > threshold)
    if (evaluations.length > 0 && evaluations[0].score > 0.5) {
      const topPlugin = this.plugins.get(evaluations[0].plugin)
      if (topPlugin && topPlugin.actions.length > 0) {
        const action = topPlugin.actions[0]
        console.log(`[Eliza] Executing action: ${action.name}`)

        try {
          await this.executeAction(action.name, "autonomous", {})
        } catch (error) {
          console.error(`[Eliza] Action execution failed:`, error)
        }
      }
    }
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<{
    totalActions: number
    successfulActions: number
    failedActions: number
    memorySize: number
    uptime: number
  }> {
    const supabase = await createClient()

    const { count: totalActions } = await supabase
      .from("eliza_actions")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)

    const { count: successfulActions } = await supabase
      .from("eliza_actions")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)
      .eq("status", "completed")

    const { count: failedActions } = await supabase
      .from("eliza_actions")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)
      .eq("status", "failed")

    const { count: memorySize } = await supabase
      .from("eliza_memory")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)

    const uptime = this.config ? Date.now() - new Date(this.config.created_at).getTime() : 0

    return {
      totalActions: totalActions || 0,
      successfulActions: successfulActions || 0,
      failedActions: failedActions || 0,
      memorySize: memorySize || 0,
      uptime,
    }
  }
}

/**
 * Create a new Eliza agent
 */
export async function createElizaAgent(
  ownerAddress: string,
  config: {
    name: string
    bio: string
    personality: string[]
    capabilities: string[]
  },
): Promise<ElizaAgentConfig> {
  const supabase = await createClient()

  const agentId = crypto.randomUUID()

  // Create agent
  const { data: agent, error } = await supabase
    .from("eliza_agents")
    .insert({
      id: agentId,
      owner_address: ownerAddress,
      name: config.name,
      bio: config.bio,
      personality: config.personality,
      capabilities: config.capabilities,
      is_active: false,
      memory_budget_mb: 100,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create agent: ${error.message}`)
  }

  // Generate wallet
  try {
    const wallets = await generateWalletsForAgent(agentId, ownerAddress, 1)
    await supabase.from("eliza_agents").update({ wallet_address: wallets[0].address }).eq("id", agentId)
  } catch (walletError) {
    console.error("[Eliza] Failed to generate wallet:", walletError)
    // Continue without wallet - can be generated later
  }

  return agent
}
