import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
})
