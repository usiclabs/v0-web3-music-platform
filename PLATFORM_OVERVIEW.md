# USI - Web3 Music Streaming Platform: Comprehensive Overview

## EXECUTIVE SUMMARY

USI is a blockchain-powered music streaming platform combining Web3 micropayments, NFT integration, AI agents, and real-time analytics. The platform enables artists to monetize music directly, listeners to own pieces of artists via tokenization, and participants to engage with autonomous trading/streaming agents.

**Core Value Proposition**: Artists get paid per-stream in real-time USDC on Base blockchain; listeners gain access to premium content through token-gating and can participate in prediction markets and agent-driven yield strategies.

---

## 1. ARCHITECTURE OVERVIEW

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **Blockchain**: Base (mainnet & Sepolia testnet), viem v2, wagmi v2
- **Storage**: Vercel Blob (audio, images)
- **Web3 Libraries**: 
  - `@coinbase/coinbase-sdk` (CDP integration)
  - `@supabase/supabase-js` (auth & DB)
  - `wagmi` & `viem` (blockchain interactions)
  - `@walletconnect/universal-provider` (wallet connectivity)
- **Additional**: Framer Motion (animations), SWR (data fetching), Recharts (analytics), Livepeer (streaming)

### Core Domains
1. **Content Layer**: Track upload, management, NFT integration
2. **Payment Layer**: X402 micropayments, token swaps, staking
3. **Social Layer**: Following, likes, comments, playlist creation
4. **Agent Layer**: AI-driven autonomous agents (trading, streaming, market-making)
5. **Analytics Layer**: Real-time performance metrics, earnings tracking
6. **Web3 Layer**: Wallet authentication, token management, smart contracts

---

## 2. FEATURE BREAKDOWN

### 2.1 Core Streaming & Payments

**X402 Protocol (Pay-Per-Play)**
- Listeners pay per 30-second chunk in USDC
- Payment verified on-chain before audio chunk unlocks
- Automatic royalty distribution per configured splits
- Base blockchain for low-cost transactions

**Token Gating**
- Tracks can require token balance to stream
- Configurable token address and minimum balance
- Listeners must hold specified token to access content

**Micropayment Flow**
\`\`\`
1. Listener initiates play
2. Every 30 seconds: payment prompt
3. User approves USDC transaction
4. Smart contract verifies payment
5. Next audio chunk unlocked
6. Royalties auto-distributed
\`\`\`

### 2.2 Artist Tools

**Artist Dashboard** (`/dashboard`)
- Upload & manage tracks
- View real-time earnings
- Analyze listener demographics
- Configure royalty splits
- Token-gate content
- Create/manage live streams

**Track Upload** (`/dashboard/upload`)
- Audio file upload with cover art
- Metadata configuration (title, duration, pricing)
- Royalty split setup
- Content type selection (regular/token-gated/NFT)

**Earnings Tracking** (`/dashboard/earnings`)
- Real-time payment notifications
- Historical earnings reports
- Per-track revenue breakdown
- Listener insights

**Profile Tokenization** (`/profile`)
- Create personal artist token (ERC-20)
- Set token contract address
- Market cap display
- Token swap interface

### 2.3 Listener Features

**Discovery**
- `/discover` - Curated exploration of tracks/artists
- `/trending` - Real-time trending tracks
- `/explore` - Full catalog search with filters
- `/search` - Keyword search with suggestions

**Social Features**
- Follow artists (`/following`)
- Like/unlike tracks
- Comments on tracks
- Create & manage playlists
- Share tracks via social buttons
- Activity feed (`/activity-feed`)

**Content Access**
- Full songs unlock through micropayments
- Playlist creation and sharing
- Story viewing (token-gated optional)
- Recently played history

**Listening Experience**
- Web3-native audio player
- Real-time listener count
- Audio quality streaming (Vercel Blob)
- Playback history tracking

### 2.4 AI Agents System

**Agent Types**

1. **Autonomous Artist Agent**
   - Auto-generates music using Suno AI
   - Publishes to platform automatically
   - Configurable daily budget & generation frequency
   - Tracks earnings & songs generated
   - Databases: `autonomous_artist_agents`, `autonomous_artist_activity`, `autonomous_artist_wallets`

2. **Auto-Stream Agent**
   - Autonomous wallet streams music on platform
   - Configurable play frequency & track duration
   - Genre/artist targeting
   - Tracks total streams & payments made
   - Databases: `auto_stream_agents`, `auto_stream_agent_wallets`, `auto_stream_activity`

3. **Market-Making Agent**
   - Autonomous trading on DEX pools
   - Multiple wallet support for volume generation
   - Burst, Pro, Fomo, and Max trading modes
   - Real-time portfolio tracking
   - Configurable buy/sell intervals and amounts
   - Databases: `mm_agents`, `mm_agent_wallets`, `mm_agent_portfolio`, `mm_agent_activity`

4. **Investment Agent**
   - Autonomous purchasing of artist tokens
   - Strategy-driven buys (artist score, social metrics)
   - Portfolio tracking with PnL calculation
   - Configurable daily limits and thresholds
   - Databases: `investment_agents`, `investment_agent_wallets`

5. **Token Sniper Agent**
   - Auto-buys tokens matching criteria
   - Artist whitelist/blacklist support
   - Daily purchase limits
   - Databases: `token_sniper_agents`

6. **Streaming/Music Agents (Eliza)**
   - Custom extensible agent framework
   - Database: `agents`, `agent_feedback`, `agent_signals`, `agent_trades`, `agent_portfolio`, `agent_activity_log`

**Agent Management**
- `/agents` - Browse all available agents
- `/agents/[address]` - Agent detail & stats
- `/dashboard/agent/*` - Create/manage own agents
- Real-time activity logging & error tracking

### 2.5 Prediction Markets

**Prediction Features**
- Create markets on artist performance/track metrics
- Binary YES/NO outcome betting
- Real-time odds calculation
- Automated resolution on target dates
- PnL tracking per position
- Databases: `prediction_markets`, `prediction_trades`, `prediction_positions`, `prediction_payouts`

### 2.6 NFT Integration

**Music NFTs**
- ERC-1155 standard with immutable royalty splits
- Multiple editions per track
- Minting on demand via CDP
- Marketplace listing & trading
- Rarity scoring
- Databases: `music_nfts`, `nft_collections`, `nft_listings`, `nft_sales`, `nft_bids`

**NFT Marketplace**
- `/nft-marketplace` - Browse collections
- `/nft-marketplace/mint` - Mint new NFTs
- `/nft-marketplace/collection` - Collection details
- Price history & trading volume

### 2.7 Live Streaming

**Live Capabilities**
- Start live stream sessions (`/live/start`)
- Real-time viewer count
- Livepeer integration for video hosting
- Stream recording & playback
- Live chat with comments
- Schedule streams (`/studio`)
- Databases: `live_streams`, `livestream_comments`

### 2.8 Additional Features

**Staking**
- Lock tokens for rewards
- APY tracking
- Historical staking data
- Databases: `staking_history`

**Token Swaps**
- Swap any ERC-20 tokens
- Integration with Uniswap V3
- Price history tracking
- Databases: `swap_history`

**Liquidity Pool Management**
- Provide liquidity to pools
- Track positions & yields
- View pool analytics
- Database integrations with DEX

**Referral System**
- Generate referral codes
- Track referred users
- Leaderboard rankings
- Achievement system
- Databases: `referrals`

**Stories** (Like Instagram Stories)
- Token-gated ephemeral content
- 24-hour expiration
- View tracking
- Analytics
- Databases: `stories`, `story_views`

**Builder Program**
- Register builder codes for referrals
- Leaderboard competition
- Reward tracking
- Databases: `builder_codes`

**Airdrop**
- Claim platform rewards
- Eligibility verification
- Historical claim tracking

**Rewards**
- Token streaming (Sablier integration)
- Claim-based rewards
- Databases: `reward_streams`, `reward_claims`

---

## 3. DATABASE SCHEMA (62 Tables)

### User & Profile Management
- **profiles** - Artist/listener profiles with wallet authentication
- **follows** - Following relationships
- **user_presence** - Real-time user activity status

### Content
- **tracks** - Music metadata (title, audio_url, cover_url, pricing, token-gating)
- **royalty_splits** - Revenue distribution configuration per track
- **comments** - Track comments with parent nesting
- **likes** - Track likes tracking

### Streaming & Payments
- **streams** - Individual play events with payment tracking
- **earnings_events** - Real-time earnings notifications
- **generation_payments** - Payment logs for AI music generation
- **x402_*tables** - X402 protocol state & verification

### Playlists & Collections
- **playlists** - User-created playlists
- **playlist_tracks** - Track membership in playlists

### Agents
- **agents** - Core agent registry (all agent types)
- **agent_signals** - Trading signals generated
- **agent_trades** - Trade history & outcomes
- **agent_portfolio** - Agent holdings & PnL
- **agent_activity_log** - Activity history
- **agent_feedback** - User feedback on agents
- **auto_stream_agents** - Autonomous streaming config
- **autonomous_artist_agents** - AI music generation config
- **mm_agents** - Market-maker agent config
- **investment_agents** - Investment strategy config
- **token_sniper_agents** - Token sniper config
- **music_streaming_agents** - Listener behavior agents

### Agent Wallets (Encrypted Private Keys)
- **auto_stream_agent_wallets**
- **autonomous_artist_wallets**
- **mm_agent_wallets**
- **investment_agent_wallets**
- **boost_wallets**

### Predictions
- **prediction_markets** - Market definitions
- **prediction_trades** - User positions/trades
- **prediction_positions** - Current holdings
- **prediction_payouts** - Payout history

### NFTs
- **music_nfts** - NFT metadata & ownership
- **nft_collections** - Collection definitions
- **nft_listings** - Marketplace listings
- **nft_sales** - Transaction history
- **nft_bids** - Auction bids
- **nft_favorites** - User NFT favorites

### Live Streaming
- **live_streams** - Stream sessions
- **livestream_comments** - Live chat

### Social & Interactions
- **notifications** - User notifications
- **stories** - Ephemeral content (token-gated)
- **story_views** - Story view tracking

### Transactions & History
- **swap_history** - Token swap records
- **staking_history** - Staking activity
- **auto_investment_transactions** - Auto-invest records
- **relayed_transactions** - Gasless transaction logs

### Configuration & Settings
- **auto_investment_settings** - User auto-invest preferences
- **session_keys** - Gasless session key config
- **search_history** - User search tracking

### Platform
- **reports** - Track/content reports (moderation)
- **careers** - Job listings
- **boost_activity** - Boost campaign activity
- **boosts** - Trading boost campaigns
- **referrals** - Referral program
- **builder_codes** - Builder program codes

All tables have **Row-Level Security (RLS)** enabled for data protection.

---

## 4. API ENDPOINTS (200+ Routes)

### Authentication & Users
- `POST /api/users/[address]/verify` - Verify wallet ownership
- `GET /api/follows/[address]` - Get follower list
- `POST /api/follows/check` - Check if user follows target
- `GET /api/follows/stats/[address]` - Follow statistics

### Tracks
- `GET /api/tracks/[id]` - Track details
- `POST /api/tracks/create` - Upload new track
- `GET /api/tracks/[id]/similar` - Similar tracks recommendation
- `GET /api/tracks/trending` - Trending tracks
- `GET /api/tracks/[id]/comments` - Track comments

### Streaming & Payments
- `POST /api/streams/log` - Log stream event
- `GET /api/streams/recent` - Recent streams
- `GET /api/x402/stream/[trackId]` - X402 payment status
- `POST /api/x402/generate` - Generate payment transaction
- `POST /api/x402/verify` - Verify payment on-chain
- `POST /api/x402/settle` - Settle royalties
- `POST /api/verify-payment` - Verify transaction hash

### Live Streaming
- `POST /api/live/create` - Start live stream
- `GET /api/live/[id]` - Stream details
- `GET /api/live/[id]/livepeer-status` - Stream status
- `GET /api/live/streams` - List active streams
- `GET /api/live/check-eligibility` - Check artist eligibility

### Agents
- `POST /api/agents/register` - Register new agent
- `GET /api/agents/[address]` - Agent details
- `GET /api/agents/route` - List all agents
- `POST /api/agents/create-playlist` - Agent playlist generation
- `POST /api/agents/run-cycle` - Manual agent cycle execution
- `POST /api/agents/invest` - Agent investment trigger
- `GET /api/agents/portfolio/route` - Agent portfolio
- `POST /api/agents/portfolio/refresh-values` - Refresh portfolio PnL

### Auto-Stream Agents
- `POST /api/agents/auto-stream/create` - Create auto-stream agent
- `POST /api/agents/auto-stream/run` - Manual run
- `GET /api/agents/auto-stream/stats` - Agent statistics
- `GET /api/agents/auto-stream/config` - Agent configuration

### Autonomous Artist Agents
- `POST /api/agents/autonomous-artist/create` - Create music generation agent
- `GET /api/agents/autonomous-artist/route` - List agents

### Market-Making Agents
- `POST /api/agents/mm/create` - Create MM agent
- `GET /api/agents/mm/stats` - MM statistics
- `POST /api/agents/mm/wallets/route` - List wallets
- `POST /api/agents/mm/wallets/fund` - Fund agent wallet
- `POST /api/agents/mm/wallets/withdraw` - Withdraw from wallet
- `POST /api/agents/mm/burst` - Trigger burst mode
- `POST /api/agents/mm/pro-mode` - Enable pro mode
- `POST /api/agents/mm/max-mode` - Enable max mode
- `POST /api/agents/mm/v4-support/pools` - Detect Uniswap V3 pools
- `POST /api/agents/mm/v4-support/swap` - Execute swap

### Music Generation (Suno AI)
- `POST /api/suno/generate` - Generate track
- `GET /api/suno/status` - Generation status
- `POST /api/suno/callback` - Webhook callback
- `POST /api/suno/upload-audio` - Upload generated audio
- `POST /api/suno/generate-video` - Generate music video
- `POST /api/suno/add-instrumental` - Add instrumental
- `POST /api/suno/add-vocals` - Add vocals
- `POST /api/suno/extend` - Extend track
- `POST /api/suno/cover` - Generate cover

### Predictions
- `POST /api/predictions/markets/route` - List markets
- `POST /api/predictions/markets/create` - Create new market
- `POST /api/predictions/trade` - Place prediction trade
- `GET /api/predictions/markets/[id]` - Market details
- `POST /api/predictions/resolve` - Resolve market outcome

### NFTs
- `POST /api/profile/tokenize` - Create profile token
- `POST /api/nft/upload-banner` - Upload collection banner
- `/api/nft-marketplace/*` - Full marketplace operations

### Tokens & Trading
- `GET /api/token/metrics/[address]` - Token metrics
- `GET /api/token/price-history/[address]` - Price history
- `POST /api/tokens/deploy-clanker` - Deploy token on Clanker

### Search & Discovery
- `POST /api/search/route` - Full-text search
- `GET /api/search/suggestions` - Search suggestions
- `POST /api/search/history` - Search history

### Playlists
- `POST /api/playlists/route` - Create playlist
- `GET /api/playlists/[id]` - Playlist details
- `GET /api/playlists/[id]/tracks` - Playlist tracks

### User Features
- `POST /api/likes/[trackId]` - Like track
- `POST /api/comments/[id]` - Comment on track
- `POST /api/following/route` - Get following list
- `POST /api/stories/route` - Create story
- `GET /api/stories/[id]/view` - View story

### Staking
- `GET /api/staking/apy` - Current APY

### Referrals
- `GET /api/referrals/leaderboard` - Referral leaderboard
- `GET /api/referrals/achievements` - Achievement tracking

### Admin
- `POST /api/admin/tracks/[id]/feature` - Feature track
- `POST /api/admin/tracks/[id]/hide` - Hide track
- `POST /api/admin/users/[address]/verify` - Verify artist
- `POST /api/admin/airdrop/export` - Export airdrop data

### Uploads
- `POST /api/upload/audio` - Upload audio file (returns signed URL)
- `POST /api/upload/image` - Upload image (returns signed URL)
- `POST /api/upload/video` - Upload video (returns signed URL)
- `POST /api/storage/signed-upload-url` - Get Vercel Blob upload URL

### Analytics & Platform
- `GET /api/platform/stats` - Platform-wide statistics
- `GET /api/stats/homepage` - Homepage statistics

### Auto-Investment
- `POST /api/auto-investment/session/create` - Create session key
- `POST /api/auto-investment/session/revoke` - Revoke session
- `POST /api/auto-investment/settings/route` - User settings

---

## 5. PAGE STRUCTURE & NAVIGATION

### Public Pages
- `/` - Home/Landing
- `/landing` - Full landing page
- `/discover` - Discover new music (curated)
- `/explore` - Explore (search catalog)
- `/trending` - Trending tracks
- `/search` - Global search
- `/artists` - Browse all artists
- `/live` - Live streams directory
- `/tokens` - Token marketplace
- `/predictions` - Prediction markets

### Content Pages
- `/track/[id]` - Individual track detail
- `/artist/[address]` - Artist profile
- `/playlist/[id]` - Playlist detail
- `/live/[id]` - Live stream detail
- `/predictions/[id]` - Market detail

### User Pages (Authenticated)
- `/profile` - User profile & history
- `/dashboard` - Artist control panel
- `/dashboard/upload` - Upload track
- `/dashboard/edit/[id]` - Edit track
- `/dashboard/earnings` - Earnings dashboard
- `/dashboard/analytics` - Analytics dashboard
- `/dashboard/agent/*` - Agent management
- `/wallet` - Web3 wallet page
- `/following` - Following list
- `/stories` - Story management
- `/playlist` - Playlist creation

### Agent Pages
- `/agents` - All agents directory
- `/agents/[address]` - Agent detail
- `/agents/register` - Register new agent
- `/agents/autonomous-artist` - Autonomous artist info
- `/agents/auto-stream` - Auto-stream info
- `/agents/market-maker` - Market-maker info
- `/agents/beat-scout` - Beat discovery agent
- `/agents/producer` - Producer agent
- `/agents/activity` - Agent activity feed
- `/dashboard/agent/autonomous-artist` - Manage autonomous artist
- `/dashboard/agent/auto-stream` - Manage auto-stream
- `/dashboard/agent/mm` - Manage market-maker

### Feature Pages
- `/nft-marketplace` - NFT marketplace
- `/nft-marketplace/mint` - Mint new NFT
- `/swap` - Token swap interface
- `/staking` - Staking dashboard
- `/lp-manager` - Liquidity pool manager
- `/live/start` - Start streaming
- `/live/studio/[id]` - Live streaming studio
- `/airdrop` - Airdrop claims
- `/referrals` - Referral dashboard
- `/rewards` - Rewards tracking
- `/predictions/create` - Create prediction market

### Info Pages
- `/about` - About page
- `/docs` - Documentation hub
- `/docs/getting-started`
- `/docs/artist-guide`
- `/docs/wallet-setup`
- `/docs/api-reference`
- `/docs/smart-contracts`
- `/docs/x402-protocol`
- `/docs/live-streaming`
- `/docs/auto-investment`
- `/docs/staking`
- `/docs/ai-music-generation`
- `/docs/erc-8004-agents`
- `/docs/cdp-integration`
- `/changelog` - Release notes
- `/careers` - Job listings
- `/press` - Press kit
- `/terms` - Terms of service
- `/privacy` - Privacy policy
- `/whitepaper` - Platform whitepaper

### Admin/Special
- `/admin` - Admin dashboard
- `/admin/gasless` - Gasless configuration
- `/admin/careers` - Career management
- `/developers` - Developer portal
- `/builder-codes` - Builder program
- `/skills` - Agent skills registry
- `/simulator` - Trading simulator

---

## 6. COMPONENT ARCHITECTURE

### Layout Components
- `header.tsx` - Top navigation
- `mobile-bottom-nav.tsx` - Mobile navigation
- `mobile-menu.tsx` - Mobile drawer menu
- `theme-provider.tsx` - Dark theme provider
- `page-transition.tsx` - Route transitions

### Audio & Media
- `audio-player.tsx` - Web3 audio player
- `video-player.tsx` - Video playback
- `wallpaper-carousel.tsx` - Hero section carousel
- `stories-carousel.tsx` - Story carousel
- `stories-viewer.tsx` - Story viewing UI

### Track & Artist Components
- `track-card.tsx` - Track listing card
- `track-detail-content.tsx` - Full track page
- `track-comments.tsx` - Comment thread
- `track-analytics-charts.tsx` - Track analytics
- `similar-tracks.tsx` - Recommendations
- `artists-feed.tsx` - Artist list
- `featured-artists-carousel.tsx` - Featured artists
- `artist-page-client.tsx` - Artist profile

### Playlist & Library
- `playlist-card.tsx` - Playlist preview
- `create-playlist-modal.tsx` - Playlist creation
- `add-to-playlist-modal.tsx` - Add track to playlist
- `recently-played.tsx` - Listen history

### Social Features
- `like-button.tsx` - Like/unlike toggle
- `follow-button.tsx` - Follow/unfollow toggle
- `followers-list.tsx` - Followers modal
- `following-list.tsx` - Following modal
- `social-share-buttons.tsx` - Share on social
- `verified-badge.tsx` - Verification badge

### Agents
- `agent-detail.tsx` - Agent information
- `agent-marketplace.tsx` - Agent browsing
- `agent-selection/` - Agent selection UI
- `agent-detail-client.tsx` - Agent dashboard
- `eliza/agent-activity-feed.tsx` - Activity tracking
- `register-agent-dialog.tsx` - Agent registration

### Tokens & Trading
- `token-detail-drawer.tsx` - Token info
- `token-metrics-modal.tsx` - Token statistics
- `token-price-chart.tsx` - Price history chart
- `token-swap-drawer.tsx` - Swap interface
- `token-swap-history.tsx` - Swap history
- `token-trading-history.tsx` - Trade history
- `tokenize-profile-modal.tsx` - Profile tokenization
- `copy-token-address-button.tsx` - Copy utility

### Predictions
- (Prediction market components in feature modules)

### NFTs
- `nft/nft-marketplace-browse.tsx` - NFT browsing
- `nft/nft-mint-form.tsx` - NFT minting
- `nft/nft-purchase-modal.tsx` - Purchase flow
- `nft/vinyl-record-card.tsx` - NFT display
- `nft/vinyl-record-3d.tsx` - 3D visualization

### Live Streaming
- `live-stream-card.tsx` - Stream preview
- `livestream-chat.tsx` - Live chat
- `studio/studio-header.tsx` - Studio toolbar
- `studio/studio-sidebar.tsx` - Studio controls
- `studio/studio-timeline.tsx` - Timeline editor
- `studio/studio-mixer.tsx` - Audio mixer
- `studio/transport-controls.tsx` - Playback controls

### Analytics & Data
- `analytics-chart.tsx` - Generic charts
- `platform-analytics-charts.tsx` - Platform stats
- `top-artists-table.tsx` - Artist rankings
- `top-tracks-table.tsx` - Track rankings
- `trending-feed.tsx` - Trending display
- `trending-widget.tsx` - Trending widget

### Forms & Input
- `upload-form.tsx` - File upload
- `profile-form.tsx` - Profile editor
- `edit-track-form.tsx` - Track editor
- `create/audio-upload.tsx` - Audio upload
- `create/tool-selector.tsx` - Tool selection

### Utilities
- `empty-state.tsx` - Empty state display
- `error-boundary.tsx` - Error handling
- `error-state.tsx` - Error display
- `loading-spinner.tsx` - Loading indicator
- `skeleton-loader.tsx` - Skeleton UI
- `notification-center.tsx` - Notification hub
- `realtime-notifications.tsx` - Real-time alerts
- `earnings-toast-listener.tsx` - Earnings notifications
- `wallet-connect-prompt.tsx` - Wallet connection

### 3D & Media
- `lava-lamp-background.tsx` - Animated background
- `nft/vinyl-record-3d.tsx` - 3D vinyl record

### Market-Making
- `mm-v4-pool-detector.tsx` - Pool detection
- `mm-v4-swap-panel.tsx` - Swap interface
- `mm-v4-swap-history.tsx` - Swap history

---

## 7. AUTHENTICATION & AUTHORIZATION

### Wallet Authentication
- Supported wallets: MetaMask, Coinbase Wallet, WalletConnect
- Uses `wagmi` v2 for wallet connection
- Verifies wallet ownership on-chain
- Creates/updates user profile on first login
- RLS policies enforce per-wallet data access

### Session Management
- Session keys for gasless transactions (EIP-3009)
- Spending limits per session
- Automatic session expiration

### Row-Level Security (RLS)
- All tables protected by RLS policies
- Users can only access their own data
- Public reads for shared content (tracks, artists, etc.)
- Service role bypass for system operations

---

## 8. SMART CONTRACTS & WEB3 INTEGRATION

### Blockchain Network
- **Base Mainnet** (production)
- **Base Sepolia** (testnet)

### Tokens
- **USDC** (Payment token)
  - Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **$USI** (Platform token - coming soon)

### Smart Contract Integrations
- **X402 Protocol** - Micropayment channels
- **ERC-1155** - NFT standard with royalty splits
- **ERC-8004** - Agent-driven commerce protocol
- **Uniswap V3** - DEX integration for swaps
- **Sablier** - Token streaming for rewards
- **Clanker** - Token deployment platform

### Gasless Transactions
- EIP-3009 sponsored transfers
- Session key delegation
- Relayer infrastructure
- Subsidy pool management

---

## 9. REAL-TIME FEATURES

### WebSocket Integration
- Live stream status updates
- Real-time notifications
- User presence tracking
- Agent activity feeds
- Live chat messages

### Realtime Components
- `realtime-notifications.tsx` - Notification stream
- `presence-tracker.tsx` - User activity tracking
- `friend-activity-sidebar.tsx` - Friend presence

### Analytics Updates
- Real-time earnings display
- Live listener count
- Agent performance tracking
- Trade execution notifications

---

## 10. EXTERNAL INTEGRATIONS

### Suno AI
- AI music generation
- Lyrics generation
- Audio refinement (vocals, instruments, extension)
- Video generation
- Metadata: `autonomous_artist_activity`

### Livepeer
- Live streaming infrastructure
- Stream recording & playback
- Real-time transcoding
- Analytics integration

### Vercel Blob
- Audio file storage
- Image storage
- Video storage
- CDN acceleration

### Coinbase Developer Platform (CDP)
- Wallet creation
- NFT minting via CDP
- Transaction broadcasting
- Smart contract interaction

### Farcaster
- Embedded frame support
- Social graph integration
- Miniapp SDK

### Zora Protocol
- NFT minting options
- Creator tools

---

## 11. DATA FLOW EXAMPLES

### Track Upload Flow
\`\`\`
1. Artist navigates to /dashboard/upload
2. Uploads audio file → Vercel Blob
3. Uploads cover image → Vercel Blob
4. Configures metadata, pricing, royalty splits
5. Creates track record in Supabase
6. Creates royalty_split records
7. Track appears in catalog
\`\`\`

### Streaming Payment Flow
\`\`\`
1. Listener clicks play on track
2. Audio player initiates playback
3. Every 30 seconds:
   a. Calculate payment amount (price_per_chunk × 1)
   b. Generate X402 payment transaction
   c. Display payment modal (USDC approval)
   d. User signs transaction in wallet
   e. Transaction submitted to Base blockchain
   f. API verifies on-chain payment
   g. Unlock next audio chunk
   h. Log stream event
   i. Queue royalty distribution
\`\`\`

### Agent Trading Cycle Flow (Market-Maker Example)
\`\`\`
1. Agent cycle triggered (cron, manual, or API)
2. Fetch current pool price & liquidity
3. Execute buy transaction (configurable amount/interval)
4. Log trade to agent_trades table
5. Update agent_portfolio with new position
6. Wait for configured sell_interval_minutes
7. Execute sell transaction
8. Calculate PnL and log
9. Repeat on schedule
\`\`\`

### Prediction Market Resolution
\`\`\`
1. Market resolution date reached
2. Fetch outcome data from verification_source
3. Compare against outcome_threshold
4. Determine winning side (YES/NO)
5. Calculate shares held per user
6. Generate prediction_payouts records
7. Create earnings notifications
8. Mark market as resolved
\`\`\`

---

## 12. PERFORMANCE & OPTIMIZATION

### Caching Strategy
- SWR for client-side data caching
- Revalidation on focus
- Manual refresh for real-time updates

### Image Optimization
- Vercel Blob CDN acceleration
- WebP format for modern browsers
- Responsive sizing

### Code Splitting
- Dynamic route imports
- Component lazy loading
- Modal/drawer lazy loading

### Database Optimization
- Indexed queries on frequently-used fields
- RLS policies optimized for row filtering
- Connection pooling via Neon

---

## 13. MONETIZATION MODEL

### Revenue Streams
1. **Creator Revenue** (Primary)
   - Per-stream USDC payments
   - Royalty splits between collaborators
   - NFT sales

2. **Platform Fees** (Secondary)
   - Potential transaction fees on swaps
   - NFT marketplace fees
   - Premium features (future)

3. **Agent Services** (Tertiary)
   - Agent usage fees
   - Performance-based fees
   - Subscription tiers (future)

---

## 14. SECURITY CONSIDERATIONS

### Smart Contract Security
- RLS on all database tables
- Session key spending limits
- Gasless transaction verification
- Admin whitelist for critical operations

### Data Protection
- Encrypted private keys in wallets
- Session expiration
- User-scoped queries
- Audit logging

### User Safety
- Report/moderation system for content
- Artist verification badges
- Activity tracking
- Notification abuse prevention

---

## 15. CONTENT MODERATION

- `/api/reports/create` - Report content
- **reports** table tracking
- Admin review workflow
- Hidden track functionality
- Reviewer feedback tracking

---

## 16. GETTING STARTED FOR NEW USERS

### As a Listener
1. Connect Web3 wallet
2. Browse discover/trending/search
3. Click play on track
4. Approve USDC payment on first play
5. Listen to 30-second chunks (repeat payment needed)
6. Follow artists, like tracks, create playlists
7. Explore agents for passive earning/trading

### As an Artist
1. Connect wallet
2. Complete profile with artist name & bio
3. Upload tracks with metadata & cover art
4. Set price per chunk (default 0.001 USDC)
5. Configure royalty splits
6. View earnings in real-time
7. Create profile token for fans
8. Start live streams

### As an Agent Builder
1. Register agent on platform
2. Deploy agent contract
3. Configure parameters (strategy, budget, thresholds)
4. Fund agent wallet with seed capital
5. Trigger execution cycle
6. Monitor activity feed & portfolio
7. Collect protocol fees from agent actions

---

## 17. SYSTEM METRICS & KPIs

The platform tracks:
- Total tracks uploaded
- Active listeners
- Total earnings (platform-wide & per-artist)
- Streaming volume (chunks played)
- Agent trading volume
- NFT collection volume
- Prediction market volume
- User growth rate
- DAU/MAU
- Average session duration
- Platform transaction count

---

## 18. FUTURE ROADMAP HINTS

From codebase analysis, planned features include:
- Multi-chain expansion (Ethereum, Polygon, etc.)
- Advanced AI curation (beat recommendations)
- Premium subscription tiers
- Governance tokens ($USI tokenomics)
- Artist cooperatives & DAOs
- Advanced prediction markets
- Social platform deepening (DMs, groups)
- Mobile app (React Native infrastructure present)
- Voice agents for DJ automation
- Marketplace for production samples

---

## QUICK REFERENCE

### Key Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public key
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - Server-side auth
- `POSTGRES_URL`, `POSTGRES_PRISMA_URL` - Database connection
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect config
- `NEXT_PUBLIC_LIVEPEER_API_KEY`, `LIVEPEER_API_KEY` - Live streaming
- `SUNO_API_KEY` - AI music generation
- `ZORA_API_KEY` - NFT minting
- `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY` - Coinbase Developer Platform
- `NEXT_PUBLIC_CHAIN_ID` - Current chain (8453 for Base mainnet)
- `NEXT_PUBLIC_RELAYER_ADDRESS` - Gasless relayer
- `SERVER_WALLET_PRIVATE_KEY` - Server operations wallet
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage

### Key URLs
- Production: https://[your-domain].vercel.app
- Dashboard: `/dashboard`
- Agents: `/agents`
- Discovery: `/discover`
- Live: `/live`
- Docs: `/docs`

### Support & Resources
- GitHub: [repository-link]
- Documentation: `/docs`
- Support: [vercel.com/help](https://vercel.com/help)
- Community: [social-links]

---

This comprehensive overview should provide your OpenClaw agent with everything needed to understand the platform architecture, create educational content, and guide end-to-end platform usage.
