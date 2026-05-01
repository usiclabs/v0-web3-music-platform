/**
 * Agent Skill Registry & Specifications
 * Defines all available agent capabilities and their configurations
 */

export interface SkillParameter {
  name: string
  type: "string" | "number" | "boolean" | "array"
  description: string
  required: boolean
  default?: any
  options?: { label: string; value: any }[]
}

export interface SkillMetrics {
  successRate: number
  averageExecutionTime: number
  totalExecutions: number
  lastExecuted?: string
}

export interface AgentSkill {
  id: string
  name: string
  category: "discovery" | "portfolio" | "trading" | "streaming" | "market-making"
  description: string
  longDescription: string
  icon: string
  color: "cyan" | "emerald" | "teal"
  capabilities: string[]
  parameters: SkillParameter[]
  metrics?: SkillMetrics
  complexity: "beginner" | "intermediate" | "advanced"
  tags: string[]
  apiEndpoint: string
  documentation?: string
}

export const AGENT_SKILLS: AgentSkill[] = [
  {
    id: "artist-discovery",
    name: "Artist Discovery Engine",
    category: "discovery",
    description: "Autonomously scout rising artists based on streaming signals",
    longDescription:
      "Continuously monitors artist tokens for emerging talent based on streaming velocity, fan engagement, and social sentiment. Uses multi-signal analysis to identify undervalued opportunities before broader market recognition.",
    icon: "Radio",
    color: "cyan",
    capabilities: [
      "Real-time artist token monitoring",
      "Streaming velocity analysis",
      "Social sentiment tracking",
      "Early stage identification",
      "Signal aggregation",
    ],
    parameters: [
      {
        name: "minStreamingVelocity",
        type: "number",
        description: "Minimum streams per day to consider",
        required: true,
        default: 10000,
      },
      {
        name: "sentimentThreshold",
        type: "number",
        description: "Social sentiment score threshold (0-100)",
        required: true,
        default: 65,
      },
      {
        name: "maxMarketCap",
        type: "number",
        description: "Maximum market cap in USD",
        required: true,
        default: 100000,
      },
      {
        name: "scanInterval",
        type: "number",
        description: "Scan frequency in minutes",
        required: false,
        default: 15,
      },
    ],
    complexity: "intermediate",
    tags: ["discovery", "streaming", "alpha", "autonomous"],
    apiEndpoint: "/api/agents/skills/artist-discovery",
    metrics: {
      successRate: 0.78,
      averageExecutionTime: 2300,
      totalExecutions: 1247,
      lastExecuted: "2 minutes ago",
    },
  },

  {
    id: "portfolio-rebalancer",
    name: "Portfolio Rebalancer",
    category: "portfolio",
    description: "Automatically rebalance artist token holdings",
    longDescription:
      "Monitors portfolio performance and automatically rebalances holdings based on configured strategies. Executes buy/sell orders to maintain target allocations, manage risk, and optimize for growth opportunities.",
    icon: "BarChart3",
    color: "emerald",
    capabilities: [
      "Performance tracking",
      "Automated rebalancing",
      "Risk management",
      "Target allocation maintenance",
      "Smart order execution",
    ],
    parameters: [
      {
        name: "strategy",
        type: "string",
        description: "Rebalancing strategy",
        required: true,
        default: "equal-weight",
        options: [
          { label: "Equal Weight", value: "equal-weight" },
          { label: "Market Cap Weight", value: "market-cap" },
          { label: "Performance Based", value: "performance" },
        ],
      },
      {
        name: "rebalanceThreshold",
        type: "number",
        description: "Rebalance when drift exceeds threshold (%)",
        required: true,
        default: 5,
      },
      {
        name: "maxSlippage",
        type: "number",
        description: "Maximum acceptable slippage (%)",
        required: true,
        default: 0.5,
      },
      {
        name: "checkFrequency",
        type: "number",
        description: "Check frequency in minutes",
        required: false,
        default: 60,
      },
    ],
    complexity: "advanced",
    tags: ["portfolio", "risk-management", "trading", "autonomous"],
    apiEndpoint: "/api/agents/skills/portfolio-rebalancer",
    metrics: {
      successRate: 0.92,
      averageExecutionTime: 4500,
      totalExecutions: 856,
      lastExecuted: "5 minutes ago",
    },
  },

  {
    id: "streaming-optimizer",
    name: "Streaming Optimizer",
    category: "streaming",
    description: "Optimize artist royalty splits and streaming configurations",
    longDescription:
      "Analyzes listener demographics, platform distribution, and royalty flows to optimize streaming revenue. Automatically adjusts split configurations to maximize earnings across different platforms and listener segments.",
    icon: "Music",
    color: "cyan",
    capabilities: [
      "Platform analysis",
      "Split optimization",
      "Revenue forecasting",
      "Listener segmentation",
      "Dynamic configuration",
    ],
    parameters: [
      {
        name: "optimizationTarget",
        type: "string",
        description: "What to optimize for",
        required: true,
        default: "revenue",
        options: [
          { label: "Revenue Maximization", value: "revenue" },
          { label: "Growth", value: "growth" },
          { label: "Engagement", value: "engagement" },
        ],
      },
      {
        name: "platforms",
        type: "array",
        description: "Streaming platforms to include",
        required: false,
        default: ["spotify", "apple-music", "soundcloud"],
      },
      {
        name: "updateFrequency",
        type: "number",
        description: "Update frequency in days",
        required: false,
        default: 7,
      },
    ],
    complexity: "intermediate",
    tags: ["streaming", "optimization", "revenue", "analytics"],
    apiEndpoint: "/api/agents/skills/streaming-optimizer",
    metrics: {
      successRate: 0.85,
      averageExecutionTime: 3200,
      totalExecutions: 523,
      lastExecuted: "12 minutes ago",
    },
  },

  {
    id: "market-maker",
    name: "Market Maker Bot",
    category: "market-making",
    description: "Provide liquidity and market-make artist tokens",
    longDescription:
      "Operates as an autonomous market maker, quoting bids/asks for artist tokens and capturing spread. Adjusts quotes based on market conditions, volatility, and inventory levels to maintain profitable operations.",
    icon: "TrendingUp",
    color: "teal",
    capabilities: [
      "Bid/ask quoting",
      "Spread management",
      "Inventory hedging",
      "Volatility adjustment",
      "Liquidity provision",
    ],
    parameters: [
      {
        name: "spreadBps",
        type: "number",
        description: "Spread in basis points (1-100)",
        required: true,
        default: 25,
      },
      {
        name: "inventory",
        type: "number",
        description: "Target inventory size (USDC)",
        required: true,
        default: 50000,
      },
      {
        name: "maxInventoryDeviation",
        type: "number",
        description: "Max deviation from target (%)",
        required: true,
        default: 30,
      },
      {
        name: "volatilityAdjustment",
        type: "boolean",
        description: "Adjust spreads based on volatility",
        required: false,
        default: true,
      },
    ],
    complexity: "advanced",
    tags: ["market-making", "trading", "liquidity", "autonomous"],
    apiEndpoint: "/api/agents/skills/market-maker",
    metrics: {
      successRate: 0.88,
      averageExecutionTime: 1200,
      totalExecutions: 2341,
      lastExecuted: "1 minute ago",
    },
  },

  {
    id: "token-sniper",
    name: "Token Sniper",
    category: "discovery",
    description: "Identify and execute on new token launches",
    longDescription:
      "Monitors blockchain for new artist token launches and executes targeted buys based on pre-configured criteria. Captures early liquidity opportunities and identifies high-potential drops before broader market awareness.",
    icon: "Zap",
    color: "emerald",
    capabilities: [
      "Launch detection",
      "Lightning-fast execution",
      "Multi-criteria filtering",
      "Early liquidity capture",
      "Performance tracking",
    ],
    parameters: [
      {
        name: "buyAmount",
        type: "number",
        description: "Amount to buy per token (USDC)",
        required: true,
        default: 1000,
      },
      {
        name: "takeProfit",
        type: "number",
        description: "Take profit target (%)",
        required: true,
        default: 50,
      },
      {
        name: "stopLoss",
        type: "number",
        description: "Stop loss level (%)",
        required: true,
        default: 20,
      },
      {
        name: "maxTokens",
        type: "number",
        description: "Max tokens to hold simultaneously",
        required: false,
        default: 5,
      },
    ],
    complexity: "advanced",
    tags: ["trading", "discovery", "new-tokens", "aggressive"],
    apiEndpoint: "/api/agents/skills/token-sniper",
    metrics: {
      successRate: 0.72,
      averageExecutionTime: 850,
      totalExecutions: 1456,
      lastExecuted: "30 seconds ago",
    },
  },

  {
    id: "social-amplifier",
    name: "Social Amplifier",
    category: "discovery",
    description: "Amplify artist presence through social engagement",
    longDescription:
      "Autonomously engages with artist content across platforms to increase visibility and community participation. Follows artists, comments thoughtfully, and builds social signals to boost discovery and engagement metrics.",
    icon: "Share2",
    color: "cyan",
    capabilities: [
      "Multi-platform engagement",
      "Comment generation",
      "Follow optimization",
      "Engagement tracking",
      "Social signal building",
    ],
    parameters: [
      {
        name: "engagementBudget",
        type: "number",
        description: "Daily engagement actions",
        required: true,
        default: 50,
      },
      {
        name: "platforms",
        type: "array",
        description: "Platforms to engage on",
        required: false,
        default: ["twitter", "discord", "tiktok"],
      },
      {
        name: "focusArea",
        type: "string",
        description: "Primary focus",
        required: true,
        default: "emerging",
        options: [
          { label: "Emerging Artists", value: "emerging" },
          { label: "Established Artists", value: "established" },
          { label: "Rising Trends", value: "trends" },
        ],
      },
    ],
    complexity: "beginner",
    tags: ["social", "marketing", "engagement", "discovery"],
    apiEndpoint: "/api/agents/skills/social-amplifier",
    metrics: {
      successRate: 0.81,
      averageExecutionTime: 5600,
      totalExecutions: 673,
      lastExecuted: "1 hour ago",
    },
  },
]

export function getSkillById(id: string): AgentSkill | undefined {
  return AGENT_SKILLS.find((skill) => skill.id === id)
}

export function getSkillsByCategory(category: AgentSkill["category"]): AgentSkill[] {
  return AGENT_SKILLS.filter((skill) => skill.category === category)
}

export function getAllCategories(): AgentSkill["category"][] {
  const categories = new Set<AgentSkill["category"]>()
  AGENT_SKILLS.forEach((skill) => categories.add(skill.category))
  return Array.from(categories).sort()
}
