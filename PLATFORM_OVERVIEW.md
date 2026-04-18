# Web3 Music Platform - Complete Overview

## Core Pages & Routes

### Home & Landing
- **`/`** - Homepage (landing page with hero, sections, statistics)
- **`/landing`** - Landing page variant
- **`/page.tsx`** - Root page with homepage content

### Music Discovery & Playback
- **`/discover`** - Discover new music and artists
- **`/explore`** - Explore trending content
- **`/trending`** - Trending tracks
- **`/search`** - Global search functionality
- **`/track/[id]`** - Individual track page with details, comments, similar tracks
- **`/playlist/[id]`** - Playlist view with tracks

### Music Creation
- **`/create`** - AI music generation tool (Suno V5.5 integration)
- **`/studio`** - Music studio interface
- **`/upload`** - Upload audio tracks
- **`/dashboard/upload`** - Dashboard upload management
- **`/dashboard/edit/[id]`** - Edit track metadata

### Live Streaming
- **`/live`** - Live streaming hub
- **`/live/[id]`** - View live stream
- **`/live/start`** - Start a new live stream
- **`/live/studio/[id]`** - Live streaming studio
- **`/docs/live-streaming`** - Live streaming documentation

### User Profiles & Social
- **`/profile`** - User profile page
- **`/artist/[address]`** - Artist profile page
- **`/artists`** - Artists directory
- **`/following`** - Following list
- **`/settings`** - User settings
- **`/stories`** - User stories
- **`/videos`** - Video content

### Dashboard & Management
- **`/dashboard`** - Main user dashboard
- **`/dashboard/analytics`** - Analytics & statistics
- **`/dashboard/earnings`** - Earnings tracking
- **`/dashboard/agent`** - AI agent management hub
- **`/dashboard/agent/mm`** - Market Maker agent
- **`/dashboard/agent/mm/cc`** - MM Cold Start configuration
- **`/dashboard/agent/mm/docs`** - MM documentation
- **`/dashboard/agent/auto-stream`** - Auto-streaming agent
- **`/dashboard/agent/autonomous-artist`** - Autonomous artist agent

### Agents & Automation
- **`/agents`** - Agent marketplace
- **`/agents/[address]`** - Individual agent details
- **`/agents/register`** - Register new agent
- **`/ai-curator`** - AI curator agent
- **`/auto-invest`** - Auto-investment platform

### Trading & Finance
- **`/swap`** - Token swap interface
- **`/dex`** - Decentralized exchange
- **`/tokens`** - Token directory
- **`/predictions`** - Prediction markets
- **`/predictions/[id]`** - Individual prediction market
- **`/predictions/create`** - Create new prediction market
- **`/lp-manager`** - Liquidity pool manager
- **`/staking`** - Staking rewards
- **`/wallet`** - Wallet management
- **`/referrals`** - Referral program

### NFTs & Collectibles
- **`/nft-marketplace`** - NFT marketplace
- **`/nft-marketplace/collection`** - NFT collections
- **`/nft-marketplace/mint`** - Mint NFTs

### Community & Engagement
- **`/activity-feed`** - Activity feed
- **`/activity-feed-2`** - Alternative activity feed
- **`/builder-codes`** - Builder code system & leaderboard
- **`/airdrop`** - Airdrop claiming
- **`/rewards`** - Rewards dashboard
- **`/community-update`** - Community updates

### Admin & Moderation
- **`/admin`** - Admin dashboard
- **`/admin/careers`** - Career opportunities management
- **`/admin/gasless`** - Gasless transaction management
- **`/audit`** - Audit logs

### Information & Docs
- **`/about`** - About the platform
- **`/docs`** - Documentation hub
- **`/docs/getting-started`** - Getting started guide
- **`/docs/api-reference`** - API reference
- **`/docs/artist-guide`** - Artist guide
- **`/docs/wallet-setup`** - Wallet setup guide
- **`/docs/auto-investment`** - Auto-investment documentation
- **`/docs/ai-music-generation`** - AI music generation guide
- **`/docs/live-streaming`** - Live streaming documentation
- **`/docs/smart-contracts`** - Smart contract documentation
- **`/docs/x402-protocol`** - X402 protocol documentation
- **`/docs/staking`** - Staking documentation
- **`/docs/cdp-integration`** - CDP integration guide
- **`/docs/erc-8004-agents`** - ERC-8004 agents guide
- **`/whitepaper`** - Platform whitepaper
- **`/changelog`** - Changelog & updates
- **`/careers`** - Careers page
- **`/careers/[id]`** - Individual job listing
- **`/press`** - Press & media
- **`/privacy-policy`** - Privacy policy
- **`/privacy`** - Privacy documentation
- **`/terms`** - Terms of service
- **`/developers`** - Developer portal
- **`/skills`** - Platform skills/features
- **`/farcaster`** - Farcaster integration

### Testing & Utilities
- **`/dummies`** - Dummy/test data
- **`/nav`** - Navigation testing
- **`/pairing`** - Wallet pairing
- **`/onboarding`** - Onboarding flow
- **`/simulator`** - Transaction simulator
- **`/analytics`** - Analytics dashboard

---

## Core Features

### AI & Music Generation
- **Suno AI Integration** - AI-powered music generation with V5.5 model
- **Lyrics Generation** - AI-generated lyrics
- **Video Generation** - AI-generated music videos
- **Cover Creation** - Create covers of existing songs
- **Vocal Addition** - Add vocals to instrumental tracks
- **Instrumental Creation** - Generate instrumental versions

### Trading & Finance
- **Decentralized Exchange** - Token swapping
- **Liquidity Pool Management** - LP management
- **Token Deployment** - Deploy custom tokens (Clanker integration)
- **Prediction Markets** - Create and trade predictions
- **Staking** - Earn rewards through staking
- **Auto-Investment** - Automated investment strategies

### Agents & Automation
- **Market Maker Agent** - Autonomous market making with multiple modes (Pro Mode, Max Mode, Burst Mode, Cold Start)
- **Auto-Stream Agent** - Automatic streaming and distribution
- **Autonomous Artist Agent** - AI-powered artist creation
- **Investment Agent** - Automated investment decisions
- **AI Curator** - Content curation automation
- **Eliza Agents** - Extended agent framework

### Streaming & Content
- **Live Streaming** - Real-time streaming with Livepeer integration
- **Track Upload** - Upload and manage tracks
- **Playlist Creation** - Create and manage playlists
- **Story Sharing** - Create stories with monetization
- **Video Hosting** - Video content storage and streaming

### Social & Community
- **Follow/Unfollow** - Social networking
- **Comments** - Track comments and discussion
- **Likes** - Like and engage with content
- **Referral Program** - Earn through referrals
- **Builder Codes** - Builder incentive program with leaderboard
- **Airdrop Distribution** - Token airdrops

### NFTs
- **NFT Minting** - Create NFTs from tracks or content
- **NFT Marketplace** - Buy/sell NFTs
- **Collection Management** - Manage NFT collections

### Advanced Features
- **X402 Protocol** - Paid content protocol with gas subsidies
- **EIP3009 Support** - Advanced token swaps
- **Smart Wallet Integration** - Smart contract wallets
- **Builder Tools** - Builder code system & analytics
- **Analytics** - Comprehensive platform analytics
- **Search** - Global search with history and suggestions

### Web3 Integration
- **Wallet Connection** - Multi-chain wallet support
- **Gasless Transactions** - Gas-less transaction support
- **Chain Switching** - Multi-chain support (Base mainnet & Sepolia)
- **Token Management** - Track token balances
- **Contract Deployment** - Deploy smart contracts

### Payment & Monetization
- **Payment Verification** - Verify transactions
- **Earnings Tracking** - Monitor earnings
- **Payment Processing** - X402 payment processing
- **Broadcast Earnings** - Broadcast payment distribution

---

## API Endpoints Summary (200+ routes)

### Music & Content APIs
- `/api/tracks/*` - Track management
- `/api/suno/*` - Suno AI integration
- `/api/playlists/*` - Playlist management
- `/api/comments/*` - Comments system
- `/api/likes/*` - Like system
- `/api/stories/*` - Stories
- `/api/upload/*` - File uploads

### Agent APIs
- `/api/agents/*` - Agent management
- `/api/agents/mm/*` - Market Maker agent
- `/api/agents/auto-stream/*` - Auto-stream agent
- `/api/agents/autonomous-artist/*` - Autonomous artist agent
- `/api/agents/sniper/*` - Sniper agent
- `/api/eliza/agents/*` - Eliza agents

### Trading APIs
- `/api/tokens/*` - Token management
- `/api/token/*` - Token metrics
- `/api/swap/*` - Swaps (via endpoints)
- `/api/lp/*` - Liquidity pools
- `/api/predictions/*` - Prediction markets
- `/api/auto-investment/*` - Auto-investment

### Finance APIs
- `/api/staking/*` - Staking
- `/api/earnings/*` - Earnings tracking
- `/api/x402/*` - X402 protocol
- `/api/gas-subsidy/*` - Gas subsidy
- `/api/eip3009/*` - EIP3009 swaps

### Social APIs
- `/api/follows/*` - Follow system
- `/api/following/*` - Following list
- `/api/likes/*` - Likes
- `/api/referrals/*` - Referrals
- `/api/builders-codes/*` - Builder codes

### Admin APIs
- `/api/admin/*` - Admin operations
- `/api/admin/tracks/*` - Track admin
- `/api/admin/users/*` - User admin
- `/api/admin/airdrop/*` - Airdrop admin

### Utility APIs
- `/api/search/*` - Search
- `/api/platform/stats` - Platform statistics
- `/api/profile/*` - Profile management
- `/api/reports/*` - Reporting
- `/api/storage/*` - Storage management
- `/api/verify-payment/*` - Payment verification

---

## Key Integrations

1. **Suno AI** - Music generation (V5.5 model)
2. **Livepeer** - Video streaming
3. **Supabase** - Database & authentication
4. **Vercel Blob** - File storage
5. **WalletConnect** - Wallet connectivity
6. **Clanker** - Token deployment
7. **Base Chain** - Primary blockchain (8453 mainnet, 84532 Sepolia)
8. **Coinbase Developer Platform (CDP)** - Smart wallets
9. **Zora API** - NFT operations
10. **Alchemy** - RPC & analytics

---

## Smart Contracts & Tokens

- **USI Token Address** - `0xECE5d962d17901ef200Da050C7c74AB45C96Db07` (Base mainnet & Sepolia)
- **X402 Protocol** - Paid content access
- **ERC20 Tokens** - Custom token deployments
- **NFT Contracts** - Minting and trading

---

## Database Models (Supabase)

- Users & Profiles
- Tracks & Metadata
- Playlists
- Comments
- Likes
- Agents (MM, Auto-Stream, Autonomous Artist)
- Transactions & Payments
- Followers/Following
- Stories
- NFTs & Collections
- Predictions Markets
- Airdrops
- Builder Codes
- Referrals

---

## Security & Infrastructure

- Row Level Security (RLS) on Supabase tables
- Wallet-based authentication
- Gasless transaction support
- Smart contract wallet integration
- Payment verification
- Admin verification system
