# Design System Audit & Fixes

## Typography Standards
- **Headings (h1/h2/h3)**: `font-serif font-bold` - Use Playfair Display or similar
- **Body text**: `font-sans` - Use Geist or system fonts  
- **Sizes**:
  - h1: `text-5xl md:text-6xl lg:text-7xl`
  - h2: `text-3xl md:text-4xl lg:text-5xl`
  - h3: `text-2xl md:text-3xl`
  - body: `text-base md:text-lg`

## Color System
- **Primary (Red)**: `#EF4444` (red-500)
- **Gradients**: `from-red-500 via-red-500 to-red-600`
- **Background**: `#000000` with slate accents
- **Borders**: `border-red-500/20` (hover: `border-red-500/40`)
- **Text**: `text-white` or `text-white/70`, `text-white/60`

## Changes Made

### 1. Standardize Typography
- [ ] Update all h1 to use `font-serif`
- [ ] Update all h2 to use `font-serif`
- [ ] Ensure body text uses `font-sans`
- [ ] Update font sizes to design scale

### 2. Fix Color Consistency  
- [ ] Replace `bg-primary` with `bg-red-500`
- [ ] Replace `text-primary` with `text-red-400`
- [ ] Replace `border-primary` with `border-red-500`
- [ ] Update all gradients to red scale

### 3. Remove Glassmorphism
- [ ] Remove `backdrop-blur` from cards, buttons, inputs
- [ ] Keep only on: nav, modal, hero section
- [ ] Use solid `bg-slate-900/40` instead of blur

### 4. Spacing Grid (8px multiples)
- [ ] p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
- [ ] gap-4, gap-6, gap-8
- [ ] Convert arbitrary values to Tailwind scale

## Pages to Update
1. /artists - feed page
2. /managr - management dashboard
3. /artist/[address] - profile page
4. / - landing page
5. All component library (components/ui/*)

## Status: IN PROGRESS
