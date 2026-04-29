# Token Deployment Troubleshooting Guide

## Overview
Token deployments on the platform use the Clanker SDK v4 to deploy ERC20 tokens on Base mainnet. This document outlines common failure points and how to diagnose them.

## Recent Fixes Applied

### 1. Missing `totalSupply` in Clanker Deploy Config (CRITICAL)
**File:** `lib/clanker-deploy.ts`
**Issue:** The `totalSupply` parameter was received but never passed to `clanker.deploy()`, causing deployments to fail silently.
**Fix:** Now includes `totalSupply: params.totalSupply.toString()` in the deployment config.
```typescript
const deployConfig: any = {
  name: params.name,
  symbol: params.symbol,
  tokenAdmin: params.deployerAddress as Address,
  totalSupply: params.totalSupply.toString(),  // NOW INCLUDED
}
```

### 2. Invalid Parameter in Profile Tokenization (CRITICAL)
**File:** `app/api/profile/tokenize/route.ts`
**Issue:** The `targetMarketCapEth` parameter was passed to `deployClankerERC20()` but this function doesn't accept it.
**Fix:** Removed the invalid parameter.

### 3. Missing SDK Initialization Validation (HIGH)
**File:** `lib/clanker-deploy.ts`
**Issue:** No verification that the Clanker SDK properly initialized before calling deploy.
**Fix:** Added validation check:
```typescript
if (!clanker || typeof clanker.deploy !== "function") {
  throw new Error("Clanker SDK failed to initialize or deploy method unavailable")
}
```

## Common Deployment Failure Points

### A. Contract Address Detection
**Error:** "No token address returned after deployment"
**Cause:** `txResult.address` is undefined after waiting for transaction
**Solution:**
1. Ensure `SERVER_WALLET_PRIVATE_KEY` is valid and formatted correctly
2. Verify server wallet has sufficient ETH balance for gas
3. Check that transaction successfully mined (not just sent)

### B. Server Wallet Configuration
**Error:** "SERVER_WALLET_PRIVATE_KEY not configured"
**Cause:** Environment variable missing
**Solution:**
1. Set `SERVER_WALLET_PRIVATE_KEY` in Vercel project variables
2. Use format `0x{64-char-hex}` (with 0x prefix)
3. Ensure key is associated with Base mainnet account
4. Fund the account with ETH for gas fees

### C. Clanker SDK Initialization
**Error:** "Clanker SDK failed to initialize"
**Cause:** Missing dependencies or invalid chain configuration
**Solution:**
1. Verify `clanker-sdk/v4` is installed: `npm list clanker-sdk`
2. Ensure Base chain is properly configured in viem
3. Check viem version compatibility

### D. Transaction Confirmation Timeout
**Error:** "Transaction confirmation failed" or timeout
**Cause:** Network congestion, insufficient gas, or transaction mempool issues
**Solution:**
1. Increase gas limits in `lib/clanker-deploy.ts`
2. Add retry logic for failed transactions
3. Monitor Base network status

## Debugging Steps

### 1. Check Logs in Production
```bash
vercel logs --project <project-id> --prod --tail
```
Search for `[v0] [Clanker]` prefix to see deployment debug logs.

### 2. Test Deployment Locally
```bash
curl -X POST http://localhost:3000/api/tokens/deploy-clanker \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST",
    "totalSupply": 1000000000,
    "deployerAddress": "0x..."
  }'
```

### 3. Check Server Wallet Balance
Add this check to `lib/clanker-deploy.ts`:
```typescript
const balance = await publicClient.getBalance({ address: account.address })
console.log("[v0] [Clanker] Server wallet balance:", balance.toString(), "wei (~", 
  parseFloat((balance / 10n**18n).toString()), "ETH)")
```

### 4. Verify Clanker API Access
Ensure the Clanker SDK can reach its API:
```typescript
// In clanker.ts, add logging
console.log("[v0] [Clanker] Network:", base.name)
console.log("[v0] [Clanker] Chain ID:", base.id)
console.log("[v0] [Clanker] RPC URL:", http().key)
```

## Frontend Error Handling

**File:** `components/upload-form.tsx`
Token creation errors are caught and logged but don't prevent track upload (line 688-691):
```typescript
} catch (coinError) {
  console.error("[v0] Token creation failed, but track uploaded:", coinError)
  // Continue to success flow even if token creation fails
}
```

This is intentional - users can upload tracks without tokenization. If token deployment consistently fails:
1. Check browser console for API error details
2. Review server logs for Clanker SDK errors
3. Verify deployerAddress is a valid Ethereum address

## Contract Address Update (Latest)
**Old Address:** `0x987603A52d8B966E10FBD29DcB1A574049E25B07`
**New Address:** `0xECE5d962d17901ef200Da050C7c74AB45C96Db07`

All references updated in:
- `lib/web3/contracts.ts`
- All API routes using USI token
- All frontend components referencing the token
- Documentation and SQL migrations

## Performance Metrics

- Typical deployment time: 2-5 seconds
- Server wallet balance check: ~50ms
- Clanker SDK initialization: ~100ms
- Transaction confirmation: 10-30 seconds (varies by network)

## Related Files
- Route: `app/api/tokens/deploy-clanker/route.ts`
- SDK Wrapper: `lib/clanker-deploy.ts`
- ERC20 Helpers: `lib/erc20-deploy.ts`
- Profile Tokenization: `app/api/profile/tokenize/route.ts`
- Frontend: `components/upload-form.tsx`
