# X402 Implementation Guide

## Overview
The ANTI platform now implements the full X402 protocol for micropayments on audio streaming.

## How It Works

### 1. Chunk-Based Streaming
- Audio is divided into 30-second chunks (configurable in `X402_CONFIG`)
- First chunk is free for preview
- Subsequent chunks require payment

### 2. Payment Flow (X402 Protocol)

#### Step 1: Request Chunk
\`\`\`typescript
GET /api/x402/stream/{trackId}?chunk={chunkIndex}
\`\`\`
Returns `402 Payment Required` with payment instructions:
\`\`\`json
{
  "scheme": "exact",
  "network": "base",
  "token": "USDC",
  "amount": "0.005",
  "recipient": "0x...",
  "metadata": { ... }
}
\`\`\`

#### Step 2: Sign Payment Authorization
User signs EIP-712 typed data for `transferWithAuthorization`:
- Uses USDC's `transferWithAuthorization` function (EIP-3009)
- Creates cryptographic signature without sending transaction
- Signature includes: from, to, value, validAfter, validBefore, nonce

#### Step 3: Verify Payment
\`\`\`typescript
POST /api/x402/verify
\`\`\`
Forwards to Coinbase X402 facilitator to verify signature validity

#### Step 4: Settle Payment
\`\`\`typescript
POST /api/x402/settle
\`\`\`
Forwards to Coinbase X402 facilitator to execute on-chain transfer and unlock chunk

### 3. Key Components

#### X402 API Routes
- `/api/x402/stream/[trackId]` - Returns 402 with payment instructions
- `/api/x402/verify` - Verifies payment authorization
- `/api/x402/settle` - Settles payment and unlocks chunk

#### X402 Client Library
- `lib/x402/client.ts` - Client-side X402 functions
- `requestChunk()` - Request chunk and get payment instructions
- `verifyPayment()` - Verify payment with facilitator
- `settlePayment()` - Settle payment and unlock chunk

#### Audio Player Integration
- `lib/audio-player-context.tsx` - Manages playback and payments
- Tracks unlocked chunks
- Pauses playback when payment required
- Handles payment flow automatically

#### Wallet Integration
- `lib/web3/wallet-context.tsx` - Wallet connection and signing
- `signTypedData()` - Signs EIP-712 messages for payment authorization

### 4. Configuration

\`\`\`typescript
// lib/web3/contracts.ts
export const X402_CONFIG = {
  CHUNK_DURATION: 30, // seconds
  NETWORK: "base",
  SCHEME: "exact",
}

export const X402_FACILITATOR = {
  VERIFY_URL: "https://api.developer.coinbase.com/x402/verify",
  SETTLE_URL: "https://api.developer.coinbase.com/x402/settle",
}
\`\`\`

### 5. User Experience

1. User clicks play on a track
2. First 30 seconds play for free (preview)
3. At 30 seconds, playback pauses
4. Payment UI appears: "Payment required for chunk 2"
5. User clicks "Pay 0.005 USDC"
6. Wallet prompts for signature (no gas fees)
7. Payment is verified and settled
8. Chunk unlocks and playback resumes
9. Process repeats for each 30-second chunk

### 6. Benefits

- **No gas fees**: Uses signature-based authorization
- **Instant**: Payment verification is near-instant
- **Micropayments**: Enables sub-cent payments per chunk
- **Autonomous**: AI agents can pay programmatically
- **Transparent**: All payments recorded on-chain
- **Fair**: Artists paid per-play, not per-subscription

### 7. Testing

1. Upload a track with audio file
2. Set price per chunk (e.g., 0.005 USDC)
3. Connect wallet with USDC on Base
4. Play track and wait for 30 seconds
5. Payment UI should appear
6. Click "Pay to Continue"
7. Sign the payment authorization
8. Playback should resume

### 8. Future Enhancements

- Bulk chunk purchases (pay for multiple chunks at once)
- Subscription mode (unlimited plays for period)
- $ANTI token discounts for stakers
- Cross-chain support (Solana, other EVM chains)
- Offline playback with pre-purchased chunks
