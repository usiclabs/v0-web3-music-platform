# Coinbase Developer Platform (CDP) Integration

This document explains how the USIC platform integrates with Coinbase Developer Platform (CDP) SDK for enhanced blockchain operations.

## Overview

The CDP SDK provides backend tools for:
- **Server-side wallet management** - Automated operations without user interaction
- **Gasless transactions** - Sponsored transactions via Paymaster
- **Batch operations** - Efficient bulk payouts to artists
- **Smart contract interactions** - Enhanced contract deployment and interaction

## Features

### 1. Automated Artist Payouts

The platform uses CDP SDK to automatically process artist payouts:

```typescript
// Process all pending artist payouts
const result = await processArtistPayouts()
// Returns: { success: 10, failed: 0, totalAmount: "1250.50" }
```

**How it works:**
1. Aggregates unpaid streams for each artist
2. Calculates total earnings
3. Sends batch USDC transfers using CDP
4. Updates database to mark streams as paid out
5. Uses gasless transactions (Paymaster) to reduce costs

### 2. Gasless Transactions

New users can perform transactions without paying gas fees:

```typescript
// Sponsor a transaction for a user
const txHash = await sponsorTransaction(userAddress, {
  to: contractAddress,
  data: encodedData,
  value: "0"
})
```

**Use cases:**
- First-time user onboarding
- Premium features for token holders
- Promotional campaigns

### 3. Server Wallet

A secure server-side wallet handles automated operations:

```typescript
// Get server wallet
const wallet = await getServerWallet()

// Send tokens
const txHash = await sendTokens(
  recipientAddress,
  "10.50", // amount in USDC
  "usdc"
)
```

## Setup

### 1. Get CDP API Credentials

1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project
3. Generate API credentials (API Key Name and Private Key)

### 2. Configure Environment Variables

Add these to your `.env` file or Vercel environment variables:

```bash
# CDP API Credentials
CDP_API_KEY_NAME=your_api_key_name
CDP_API_KEY_PRIVATE_KEY=your_private_key

# Server Wallet Data (generated on first run)
CDP_SERVER_WALLET_DATA={"walletId":"...","seed":"..."}
```

### 3. Initialize Server Wallet

On first run, the system will create a server wallet and output the wallet data:

```bash
# Run the payout endpoint to initialize
curl -X POST http://localhost:3000/api/admin/payouts
```

Copy the wallet data from the logs and add it to `CDP_SERVER_WALLET_DATA`.

### 4. Fund Server Wallet

Transfer USDC to the server wallet address for payouts:

```typescript
// Get wallet address
const wallet = await getServerWallet()
const address = await wallet.getDefaultAddress()
console.log("Server wallet address:", address)
```

## API Endpoints

### Process Payouts

**POST** `/api/admin/payouts`

Triggers artist payout processing. Should be called via cron job or admin panel.

**Response:**
```json
{
  "success": true,
  "success": 10,
  "failed": 0,
  "totalAmount": "1250.50",
  "message": "Processed 10 payouts..."
}
```

### Check Payout Status

**GET** `/api/admin/payouts`

Returns CDP configuration status.

**Response:**
```json
{
  "cdpConfigured": true,
  "message": "CDP is configured and ready for payouts"
}
```

## Usage Examples

### Manual Artist Payout

```typescript
import { payoutArtist } from "@/lib/cdp/payouts"

// Payout a specific artist
const result = await payoutArtist("0x1234...")
console.log(`Paid ${result.amount} USDC, tx: ${result.txHash}`)
```

### Batch Payouts

```typescript
import { batchSendTokens } from "@/lib/cdp/client"

const recipients = [
  { address: "0x1234...", amount: "100.50" },
  { address: "0x5678...", amount: "250.75" }
]

const txHashes = await batchSendTokens(recipients, "usdc")
```

### Check Wallet Balance

```typescript
import { getServerWallet, getWalletBalance } from "@/lib/cdp/client"

const wallet = await getServerWallet()
const balance = await getWalletBalance(wallet, "usdc")
console.log(`Server wallet balance: ${balance} USDC`)
```

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Server Wallet**: Keep wallet data secure and backed up
3. **Access Control**: Protect admin endpoints with authentication
4. **Rate Limiting**: Implement rate limiting on payout endpoints
5. **Monitoring**: Set up alerts for failed transactions

## Cron Job Setup

For automated payouts, set up a cron job:

**Vercel Cron** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/admin/payouts",
    "schedule": "0 0 * * *"
  }]
}
```

**Or use external cron service:**
```bash
# Daily at midnight
0 0 * * * curl -X POST https://your-domain.com/api/admin/payouts
```

## Troubleshooting

### "CDP not configured" error
- Verify `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY` are set
- Check API key permissions in CDP portal

### "Insufficient funds" error
- Check server wallet balance
- Transfer USDC to server wallet address

### Transaction failures
- Check Base network status
- Verify recipient addresses are valid
- Ensure sufficient gas (though Paymaster should cover this)

## Resources

- [CDP SDK Documentation](https://docs.cdp.coinbase.com/sdks/cdp-sdks-v2/typescript)
- [CDP Portal](https://portal.cdp.coinbase.com/)
- [Base Network Documentation](https://docs.base.org/)
- [Paymaster Documentation](https://docs.cdp.coinbase.com/api-reference/paymaster)

## Support

For issues with CDP integration:
1. Check CDP SDK GitHub issues
2. Visit Coinbase Developer Discord
3. Contact CDP support through the portal
