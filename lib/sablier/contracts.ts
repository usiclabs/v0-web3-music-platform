// Sablier V2 contract addresses and ABIs for Base network
// Documentation: https://docs.sablier.com/contracts/v2/deployments

export const SABLIER_LOCKUP_LINEAR_ADDRESS = {
  8453: "0xFDD9d122B451F549f48c4942c6fa6646D849e8C1", // Base mainnet
  84532: "0x3E435560fd0a03ddF70694b35b673C25c65aBB6C", // Base Sepolia
} as const

// Simplified Sablier Lockup Linear ABI for creating and withdrawing from streams
export const SABLIER_LOCKUP_LINEAR_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "totalAmount", type: "uint128" },
          { name: "asset", type: "address" },
          { name: "cancelable", type: "bool" },
          { name: "transferable", type: "bool" },
          {
            components: [
              { name: "start", type: "uint40" },
              { name: "cliff", type: "uint40" },
              { name: "end", type: "uint40" },
            ],
            name: "timestamps",
            type: "tuple",
          },
          {
            components: [
              { name: "account", type: "address" },
              { name: "fee", type: "uint256" },
            ],
            name: "broker",
            type: "tuple",
          },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "createWithTimestamps",
    outputs: [{ name: "streamId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "streamId", type: "uint256" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint128" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "streamId", type: "uint256" }],
    name: "withdrawableAmountOf",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "streamId", type: "uint256" }],
    name: "getStream",
    outputs: [
      {
        components: [
          { name: "sender", type: "address" },
          { name: "startTime", type: "uint40" },
          { name: "endTime", type: "uint40" },
          { name: "isCancelable", type: "bool" },
          { name: "wasCanceled", type: "bool" },
          { name: "asset", type: "address" },
          { name: "isDepleted", type: "bool" },
          { name: "isStream", type: "bool" },
          { name: "isTransferable", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "streamId", type: "uint256" }],
    name: "statusOf",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Stream status enum
export enum StreamStatus {
  PENDING = 0,
  STREAMING = 1,
  SETTLED = 2,
  CANCELED = 3,
  DEPLETED = 4,
}
