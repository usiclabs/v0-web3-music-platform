# Web3 Music Platform - Bugs & Usability Issues (Priority Review)

## Current Status
Platform has core features working but needs polishing, bug fixes, and usability improvements. Three priority areas identified:
1. **Streaming & Earnings** - Core revenue engine
2. **Core Artist Pages** - Foundation for creator experience
3. **Design System & Styling** - Visual polish and consistency

---

## Priority 1: Streaming & Earnings Issues

### Issue 1.1: Quote Fetching Fails for V3/V4 Pools
**File**: `/lib/agents/market-maker-agent.ts` (line 1237)
**Problem**: `getQuote()` throws "No Uniswap V3 pool found" - pool detection logic doesn't work correctly
**Impact**: MM agent cannot execute swaps - revenue generation is blocked
**Root Cause**: `checkPoolExists()` checks wrong token pair; loop logic checks same tokenIn repeatedly
**Fix Needed**: 
- Fix pool detection to check the actual tokenIn/tokenOut pair
- Add V3 vs V4 version switching based on user selection
- Improve error messages with specific pool details

### Issue 1.2: Stream Tracking Not Recording Earnings
**File**: `/app/api/agents/mm/cycle/route.ts` or `/lib/agents/market-maker-agent.ts`
**Problem**: Streams created but `total_paid` not being updated in database
**Impact**: Artists don't see earnings even though streams are happening
**Root Cause**: Missing update to `streams` table after each payment; chunk-based payment not implemented
**Fix Needed**:
- Implement proper stream chunk tracking and payment recording
- Add real-time updates to earnings dashboard
- Fix database transaction handling for payments

### Issue 1.3: Earnings Analytics Missing Real-time Data
**File**: `/components/artist-profile-premium.tsx` or dashboard component
**Problem**: Earnings card shows static data, no real-time updates
**Impact**: Artists can't trust earnings numbers; platform feels broken
**Fix Needed**:
- Add WebSocket or polling for real-time earning updates
- Show per-stream breakdown, not just total
- Add timestamp and transaction details

---

## Priority 2: Core Artist Pages Issues

### Issue 2.1: Artist Profile Page 404s or Shows Wrong Data
**File**: `/app/artist/[address]/page.tsx`
**Problem**: Artist profiles not loading for some users; data fetching errors
**Root Cause**: Supabase query filters too strict; normalizedAddress case handling
**Fix Needed**:
- Add better error logging for failed queries
- Handle edge cases (missing bio, no tracks, no followers)
- Show proper error message instead of 404

### Issue 2.2: Earnings Calculation Inaccurate
**File**: `/app/artist/[address]/page.tsx` (line 47)
**Problem**: `totalEarnings` calculation might count streams multiple times or miss partial payments
**Fix Needed**:
- Query earnings from `artist_payments` table instead of summing streams
- Implement proper decimal handling for USDC (18 decimals)
- Add date range filtering

### Issue 2.3: Artist Name & Bio Display Issues
**File**: `/components/artist-profile-premium.tsx`
**Problem**: Long names overflow, special characters break layout, bio text sizing inconsistent
**Fix Needed**:
- Add text truncation with tooltips for long names
- Sanitize bio input to prevent HTML injection
- Use consistent text sizing with proper line clamping

### Issue 2.4: Follower Count Not Updating
**File**: `/app/artist/[address]/page.tsx` (line 20-23)
**Problem**: Follower count is static, doesn't update when new follow happens
**Fix Needed**:
- Cache invalidation on follow/unfollow actions
- Add real-time follower updates via WebSocket
- Show follow/unfollow button with loading state

---

## Priority 3: Design System & Styling Issues

### Issue 3.1: Typography Inconsistency
**Problem**: Serif fonts not applied consistently; some pages use old typography
**Files Affected**: `/app/discover/page.tsx`, `/app/explore/page.tsx`, `/app/trending/page.tsx`
**Fix Needed**:
- Apply serif font to all main headings (h1, h2)
- Ensure font-sans for body text everywhere
- Update font sizes to match design scale

### Issue 3.2: Red Accent Color (#EF4444) Not Consistent
**Problem**: Some components use red, some use primary color, some use custom colors
**Impact**: Visual hierarchy broken, doesn't feel cohesive
**Fix Needed**:
- Replace all `from-red-500 to-red-600` with `from-red-500 via-red-500 to-red-600`
- Remove all `from-primary` references, replace with red
- Update hover states to use consistent red gradients

### Issue 3.3: Glassmorphism Overused (Too Many Backdrop-blur Elements)
**Problem**: Platform uses backdrop-blur on 20+ elements - feels blurry and hard to read
**Fix Needed**:
- Keep backdrop-blur on exactly 3 elements: top nav, modal overlay, hero section
- Remove blur from stats cards, buttons, input fields
- Use solid backgrounds with borders instead

### Issue 3.4: Spacing Hierarchy Not Following 8px Grid
**Problem**: Padding/margins use inconsistent values (4px, 6px, 7px, 12px, 14px, etc)
**Fix Needed**:
- Audit all components for spacing
- Convert all values to 8px multiples: 8, 16, 24, 32, 40, 48, 56, 64
- Use Tailwind spacing scale: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)

### Issue 3.5: Mobile Responsiveness Problems
**Problem**: Text too large on mobile, buttons not clickable on touch, horizontal scrolling on some pages
**Fix Needed**:
- Test all pages at 320px, 375px, 768px breakpoints
- Ensure touch targets are minimum 44x44px
- Fix overflow issues on narrow screens

---

## Priority 4: General Usability Issues (After Core 3)

### Issue 4.1: Error Handling & User Feedback
**Problem**: Errors don't show user-friendly messages, network failures crash the page
**Fix Needed**:
- Add error boundaries to all pages
- Show toast notifications for errors instead of console logs
- Implement retry logic for failed API calls

### Issue 4.2: Loading States Missing
**Problem**: Buttons don't show loading indicator when processing, users don't know what's happening
**Fix Needed**:
- Add loading spinner to all CTAs
- Disable buttons while loading
- Show progress indicator for long operations

### Issue 4.3: Form Validation Issues
**Problem**: Forms submit invalid data; no real-time validation feedback
**Fix Needed**:
- Add client-side validation with error messages
- Show validation errors below each field
- Disable submit until form is valid

### Issue 4.4: API Rate Limiting Not Implemented
**Problem**: No protection against spam requests or abuse
**Fix Needed**:
- Add rate limiting middleware
- Return 429 Too Many Requests with retry-after header
- Show user-friendly message when rate limited

---

## Recommended Fix Order

1. **Week 1 - Streaming Engine**
   - Fix pool detection in MM agent
   - Implement proper stream tracking and payment recording
   - Add real-time earnings updates

2. **Week 2 - Artist Pages**
   - Fix artist profile data fetching
   - Correct earnings calculations
   - Add follow/unfollow real-time updates

3. **Week 3 - Design Polish**
   - Apply typography consistently
   - Fix accent color usage
   - Remove excess glassmorphism
   - Fix spacing to 8px grid
   - Mobile responsiveness audit

4. **Week 4 - Usability**
   - Add error boundaries
   - Implement loading states
   - Add form validation
   - Implement rate limiting

---

## Testing Checklist

After each fix:
- [ ] Test in development (npm run dev)
- [ ] Check console for errors
- [ ] Test on mobile (DevTools 375px)
- [ ] Test with slow 3G network
- [ ] Test with real data (multiple artists, streams)
- [ ] Check accessibility (keyboard nav, screen readers)
- [ ] Verify analytics are tracking correctly
