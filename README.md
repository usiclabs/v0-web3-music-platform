# USI - Web3 Music Streaming Platform

A blockchain-powered music streaming platform with micropayments and NFT integration.

## Features

- **X402 Micropayments**: Pay-per-play streaming with USDC on Base blockchain
- **NFT Integration**: ERC-1155 NFTs for tracks with immutable royalty splits
- **Artist Dashboard**: Upload tracks, manage royalties, view analytics
- **Real-time Analytics**: Track plays, earnings, and listener demographics
- **Wallet-based Auth**: Connect with MetaMask, Coinbase Wallet, or WalletConnect

## Tech Stack

- **Frontend**: Next.js 15+, React 19, Tailwind CSS v4
- **Web3**: wagmi v2, viem
- **Database**: Supabase (PostgreSQL with RLS)
- **Blockchain**: Base (mainnet & Sepolia testnet)
- **Payments**: USDC (ERC-20)

## Getting Started

### Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables (already configured in v0)

4. Run the database migrations:
   - Execute the SQL scripts in the `scripts/` folder in your Supabase SQL Editor
   - Or run them directly from v0

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Database Setup

The platform uses 4 main tables:

- `profiles`: Artist profiles (wallet-based)
- `tracks`: Music tracks with metadata
- `royalty_splits`: Revenue sharing configuration
- `streams`: Analytics and payment tracking

All tables have Row Level Security (RLS) enabled for data protection.

## Smart Contracts

### USDC Addresses

- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### $USI Token (Coming Soon)

ERC-20 token for platform governance and staking benefits.

## Architecture

### Payment Flow

1. Listener plays a track
2. Every 30 seconds, payment is required to continue
3. User approves USDC transaction on Base
4. API verifies transaction on-chain
5. Audio chunk is unlocked
6. Royalties are distributed per configured splits

### File Storage

- Audio files: Vercel Blob or Supabase Storage
- Cover images: Vercel Blob or Supabase Storage
- Metadata: Supabase PostgreSQL

## Development

### Key Directories

- `/app`: Next.js pages and routes
- `/components`: React components
- `/lib`: Utilities and configurations
- `/scripts`: Database migration scripts
- `/types`: TypeScript type definitions

### Important Files

- `lib/web3/config.ts`: wagmi configuration
- `lib/supabase/client.ts`: Browser Supabase client
- `lib/supabase/server.ts`: Server Supabase client
- `lib/audio-player-context.tsx`: Audio player state management

## Deployment

Deploy to Vercel with one click from the v0 interface.

## License

MIT

## Support

For issues or questions, visit [vercel.com/help](https://vercel.com/help)
