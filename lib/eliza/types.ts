// Eliza OS Agent Types
export interface ElizaAgentConfig {
  id: string
  owner_address: string
  name: string
  bio: string
  personality: string[]
  capabilities: AgentCapability[]
  is_active: boolean
  wallet_address?: string
  memory_budget_mb: number
  created_at: string
  updated_at: string
}

export type AgentCapability =
  | "music_creation"
  | "token_trading"
  | "social_interaction"
  | "content_generation"
  | "market_analysis"
  | "playlist_curation"
  | "collaboration"

export interface ElizaMemory {
  id: string
  agent_id: string
  content: string
  importance: number
  timestamp: string
  metadata: Record<string, any>
}

export interface ElizaAction {
  id: string
  agent_id: string
  action_type: string
  target: string
  parameters: Record<string, any>
  status: "pending" | "executing" | "completed" | "failed"
  result?: string
  error?: string
  created_at: string
  completed_at?: string
}

export interface AgentPlugin {
  name: string
  description: string
  actions: PluginAction[]
  evaluators: PluginEvaluator[]
  providers: PluginProvider[]
}

export interface PluginAction {
  name: string
  similes: string[]
  description: string
  validate: (params: any) => boolean
  handler: (params: any, context: AgentContext) => Promise<any>
}

export interface PluginEvaluator {
  name: string
  description: string
  evaluate: (context: AgentContext) => Promise<number>
}

export interface PluginProvider {
  name: string
  description: string
  get: (context: AgentContext) => Promise<any>
}

export interface AgentContext {
  agentId: string
  ownerAddress: string
  memory: ElizaMemory[]
  recentActions: ElizaAction[]
  walletAddress?: string
}
