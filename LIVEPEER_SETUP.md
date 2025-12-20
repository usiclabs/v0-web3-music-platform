# Livepeer Live Streaming Setup Guide

This guide will help you set up Livepeer for live streaming on the USIC platform.

## What is Livepeer?

Livepeer is a decentralized video streaming network that provides low-latency live streaming infrastructure. It's perfect for enabling artists to broadcast live performances to their fans.

## Getting Your API Keys

### Step 1: Create a Livepeer Studio Account

1. Go to [https://livepeer.studio](https://livepeer.studio)
2. Sign up for a free account
3. Verify your email address

### Step 2: Generate API Keys

Livepeer uses **two types** of API keys for security:

#### 1. Public API Key (Client-Side)
- **Purpose**: Used for playback and viewing streams
- **Permissions**: Read-only, safe to expose to browsers
- **Environment Variable**: `NEXT_PUBLIC_LIVEPEER_[REDACTED]`

**To generate:**
1. In Livepeer Studio dashboard, go to "Developers" → "API Keys"
2. Click "Create API Key"
3. Name it "USIC Public Key"
4. Select permissions: **Playback only** (read-only)
5. Copy the key

#### 2. Private API Key (Server-Side)
- **Purpose**: Used for creating and managing streams
- **Permissions**: Full admin access, NEVER expose to client
- **Environment Variable**: `LIVEPEER_API_KEY`

**To generate:**
1. In Livepeer Studio dashboard, go to "Developers" → "API Keys"
2. Click "Create API Key"
3. Name it "USIC Server Key"
4. Select permissions: **Full access** (admin)
5. Copy the key

### Step 3: Add Environment Variables

Add both keys to your Vercel project:

1. Go to the **Vars** section in the v0 in-chat sidebar
2. Add the following environment variables:

```
NEXT_PUBLIC_LIVEPEER_[KEY]=your_public_key_here
LIVEPEER_API_KEY=your_private_key_here
```

**Important Security Notes:**
- ✅ `NEXT_PUBLIC_LIVEPEER_[KEY]` is SAFE to expose (read-only permissions)
- ❌ `LIVEPEER_API_KEY` must NEVER be exposed to the client (full admin access)
- The public key can only view streams, not create or modify them
- The private key is only used in server-side API routes

## How It Works

### For Artists (Broadcasting)
1. Artist must have 3+ published tracks to be eligible
2. Artist creates a stream with title and description
3. System uses **private API key** (server-side) to create stream on Livepeer
4. Artist enters broadcast studio and goes live
5. Livepeer handles video encoding and distribution

### For Viewers (Watching)
1. Viewer browses live streams on `/live` page
2. Clicks on a stream to watch
3. Player uses **public API key** (client-side) to fetch stream
4. Livepeer delivers low-latency video stream

## Features

- ✅ Mobile-friendly broadcasting (works on phones/tablets)
- ✅ Adaptive bitrate streaming (720p, 480p, 360p)
- ✅ Low-latency WebRTC streaming
- ✅ Real-time viewer counts
- ✅ Live status indicators
- ✅ Automatic stream recording (optional)

## Testing

### Test Broadcasting
1. Connect your wallet (must be an artist with 3+ tracks)
2. Go to `/live/start`
3. Create a test stream
4. Allow camera/microphone permissions
5. Click "Go Live"

### Test Viewing
1. Open `/live` in another browser/device
2. You should see your live stream
3. Click to watch and verify playback works

## Troubleshooting

### "Stream not found" error
- Verify both API keys are set correctly
- Check that the private key has full permissions
- Ensure the stream was created successfully (check Livepeer Studio dashboard)

### Camera/microphone not working
- Check browser permissions
- Ensure you're using HTTPS (required for WebRTC)
- Try a different browser (Chrome/Edge recommended)

### Poor stream quality
- Check your internet upload speed (need at least 5 Mbps)
- Reduce stream quality in Livepeer settings
- Move closer to your WiFi router

### "Not eligible" message
- Verify you have at least 3 published tracks
- Check that tracks are marked as `is_active: true`
- Ensure your wallet is connected

## Cost

Livepeer Studio offers:
- **Free tier**: 1,000 minutes of streaming per month
- **Pay-as-you-go**: $0.005 per minute after free tier
- **Enterprise**: Custom pricing for high-volume usage

For most artists, the free tier is sufficient for regular live streams.

## Support

- Livepeer Documentation: https://docs.livepeer.org
- Livepeer Discord: https://discord.gg/livepeer
- USIC Support: Contact via `/about` page

## Security Best Practices

1. ✅ Always use separate public/private keys
2. ✅ Rotate private keys regularly (every 90 days)
3. ✅ Never commit API keys to git
4. ✅ Use environment variables for all keys
5. ✅ Monitor API usage in Livepeer Studio dashboard
6. ❌ Never share your private API key
7. ❌ Never hardcode keys in your code

---

**Ready to go live?** Head to `/live/start` and create your first stream! 🎵🔴
