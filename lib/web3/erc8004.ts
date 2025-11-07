// ERC-8004 Trustless Agents integration for USIC platform
import { createPublicClient, http, type Address } from "viem"
import { base, baseSepolia } from "viem/chains"

// Contract addresses (deploy these contracts first)
export const ERC8004_CONTRACTS = {
  8453: {
    // Base Mainnet
    identityRegistry: process.env.NEXT_PUBLIC_ERC8004_IDENTITY_REGISTRY as Address,
    reputationRegistry: process.env.NEXT_PUBLIC_ERC8004_REPUTATION_REGISTRY as Address,
    validationRegistry: process.env.NEXT_PUBLIC_ERC8004_VALIDATION_REGISTRY as Address,
  },
  84532: {
    // Base Sepolia
    identityRegistry: process.env.NEXT_PUBLIC_ERC8004_IDENTITY_REGISTRY_TESTNET as Address,
    reputationRegistry: process.env.NEXT_PUBLIC_ERC8004_REPUTATION_REGISTRY_TESTNET as Address,
    validationRegistry: process.env.NEXT_PUBLIC_ERC8004_VALIDATION_REGISTRY_TESTNET as Address,
  },
}

// Identity Registry ABI
export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [
      { name: "agentAddress", type: "address" },
      { name: "agentURI", type: "string" },
    ],
    name: "registerAgent",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "agentAddress", type: "address" }],
    name: "getAgentURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentAddress", type: "address" }],
    name: "isAgentRegistered",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newURI", type: "string" },
    ],
    name: "updateAgentURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// Reputation Registry ABI
export const REPUTATION_REGISTRY_ABI = [
  {
    inputs: [
      { name: "server", type: "address" },
      { name: "score", type: "uint8" },
      { name: "tags", type: "string[]" },
      { name: "feedbackURI", type: "string" },
      { name: "reportHash", type: "bytes32" },
      { name: "authorization", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    name: "submitFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "server", type: "address" }],
    name: "getAverageScore",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "server", type: "address" }],
    name: "getFeedbackCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Validation Registry ABI
export const VALIDATION_REGISTRY_ABI = [
  {
    inputs: [
      { name: "agent", type: "address" },
      { name: "requestHash", type: "bytes32" },
      { name: "requestURI", type: "string" },
    ],
    name: "requestValidation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "requestHash", type: "bytes32" },
      { name: "resultCode", type: "uint8" },
      { name: "tags", type: "string[]" },
      { name: "evidenceURI", type: "string" },
    ],
    name: "submitValidation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestHash", type: "bytes32" }],
    name: "getValidationResults",
    outputs: [{ name: "", type: "tuple[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export interface AgentMetadata {
  name: string
  description: string
  version: string
  capabilities: string[]
  endpoints: {
    api?: string
    websocket?: string
  }
  trustModels: string[]
  owner: Address
}

export interface AgentFeedback {
  client: Address
  server: Address
  score: number
  tags: string[]
  feedbackURI: string
  reportHash: string
  timestamp: number
}

/**
 * Register an AI agent with ERC-8004 identity
 */
export async function registerAgent(agentAddress: Address, metadata: AgentMetadata, chainId = 8453) {
  // Upload metadata to IPFS or blob storage first
  const metadataURI = await uploadAgentMetadata(metadata)

  // Then register on-chain
  // Implementation would use wagmi hooks on the frontend
  return {
    agentAddress,
    metadataURI,
  }
}

/**
 * Get agent reputation score
 */
export async function getAgentReputation(
  agentAddress: Address,
  chainId = 8453,
): Promise<{ averageScore: number; feedbackCount: number }> {
  const chain = chainId === 8453 ? base : baseSepolia
  const contracts = ERC8004_CONTRACTS[chainId as keyof typeof ERC8004_CONTRACTS]

  if (!contracts?.reputationRegistry) {
    return { averageScore: 0, feedbackCount: 0 }
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  const [averageScore, feedbackCount] = await Promise.all([
    client.readContract({
      address: contracts.reputationRegistry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "getAverageScore",
      args: [agentAddress],
    }),
    client.readContract({
      address: contracts.reputationRegistry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "getFeedbackCount",
      args: [agentAddress],
    }),
  ])

  return {
    averageScore: Number(averageScore),
    feedbackCount: Number(feedbackCount),
  }
}

/**
 * Check if an agent is registered
 */
export async function isAgentRegistered(agentAddress: Address, chainId = 8453): Promise<boolean> {
  const chain = chainId === 8453 ? base : baseSepolia
  const contracts = ERC8004_CONTRACTS[chainId as keyof typeof ERC8004_CONTRACTS]

  if (!contracts?.identityRegistry) {
    return false
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  const isRegistered = await client.readContract({
    address: contracts.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "isAgentRegistered",
    args: [agentAddress],
  })

  return isRegistered
}

/**
 * Upload agent metadata to blob storage
 */
async function uploadAgentMetadata(metadata: AgentMetadata): Promise<string> {
  const response = await fetch("/api/agents/upload-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    throw new Error("Failed to upload agent metadata")
  }

  const { url } = await response.json()
  return url
}
