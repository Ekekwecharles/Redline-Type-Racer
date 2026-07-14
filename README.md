# REDLINE — Type Racer

A typing-speed racing game. Your WPM is the throttle, mistakes send you backward, and you can race AI bots solo or real people anywhere in the world.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **NextAuth v5** (Credentials provider) for accounts — guest play works with zero friction, no account needed for solo races
- **Prisma + MongoDB Atlas** for persistence
- **Pusher Channels** for real cross-device multiplayer — presence channels + client events, no custom WebSocket server needed, deploys cleanly to Vercel

## Setup

1. `npm install` (this runs `prisma generate` automatically via postinstall)
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a MongoDB Atlas connection string
   - `AUTH_SECRET` — run `npx auth secret` to generate one
   - Pusher keys — create a free app at [pusher.com](https://pusher.com) under Channels, and **enable client events** for that app in its dashboard settings (Settings tab → "Enable client events"). Without this, multiplayer progress won't sync.
3. `npm run dev`

## How multiplayer actually works

Each race room is a Pusher **presence channel** (`presence-race-{code}`). Presence channels give you the connected member list for free, and — once client events are enabled — let browsers send events directly to each other through Pusher's relay without a round trip through your server. That's what makes this genuinely work between two people on opposite sides of the world: it's not a simulation, it's real pub/sub over Pusher's infrastructure.

The host generates the race text and start time, broadcasts `client-start`, and every client (including the host, who applies it locally since senders don't receive their own client events) counts down together. Each racer streams `client-progress` as they type; everyone renders everyone else's lane position from those events.

This is intentionally client-authoritative for a portfolio build — good enough to demonstrate the architecture and to actually play, but if you wanted to harden it against cheating (fake WPM broadcasts) you'd move race-start authority and progress validation to a server (e.g. a Pusher webhook or a lightweight API route that both clients report to).

## Accounts and guest mode

- Solo races (vs AI) work with no account. Progress is saved to `localStorage` only.
- Signing in (`/login`) persists XP, coins, unlocked cars, and race history to MongoDB via Prisma, and unlocks multiplayer (which requires knowing who's in the room, so it's gated behind auth).
- If a guest later creates an account, their local progress doesn't currently migrate — that'd be a good next feature (read `localStorage` on first authenticated load and offer to merge).

## Payments

The "Upgrade to Pro" flow is a real, polished UI (`ProUpsellModal.tsx`) but it does **not** charge real money — it's clearly labeled as a demo checkout. To make it real: create a Stripe account, replace the confirm button with a call to Stripe Checkout (`/api/checkout` creating a Checkout Session), and flip `isPro` via a Stripe webhook instead of client-side on click.

## What's genuinely production-shaped vs. what's a demo shortcut

**Production-shaped:** the auth flow, the Prisma schema, the Pusher room/presence pattern, the typing engine (`useTypingCore`), the guest/authenticated profile abstraction (`useProfile`).

**Demo shortcuts, worth knowing for an interview:** client-authoritative race timing/scoring (no server validation), no localStorage-to-account progress migration, Pro checkout doesn't touch a real payment processor, and achievements/aggregate stats are computed on read rather than stored.

## Project structure

```
src/
  app/
    page.tsx              solo race vs AI
    garage/page.tsx        car selection
    multiplayer/page.tsx   real cross-device racing
    profile/page.tsx       stats, XP, achievements, history
    login/page.tsx         sign in / register
    api/
      auth/[...nextauth]   NextAuth handler
      register             account creation
      profile              GET/PATCH game profile
      race-result          POST race, updates XP/coins/level
      pusher/auth           presence channel authorization
  components/               UI pieces (track, HUD, garage, paywall, etc.)
  hooks/
    useTypingCore.ts        the actual typing/race-progress engine
    useProfile.ts           profile state, DB-backed or localStorage-backed
  lib/                      cars, words, difficulty presets, prisma/pusher clients
  types/                    shared TypeScript types
prisma/schema.prisma        User, Account, Session, RaceResult models
```
