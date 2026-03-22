# Longform — WordPress.com Reading App Prototype

## What This Is

**Longform** is the working name for this exploratory app (not "Reader"). It's a clickable HTML prototype of a future-state WordPress.com reading experience. This is the **vision** for what we're building towards — not scoped to a 4-month delivery window. It should be demo-able: someone should be able to click through all 5 tabs, read an article, save it, see it in Saved, toggle dark mode, and feel like they're using a real app.

## Tech Stack

- **HTML + CSS + vanilla JS + JSON**. That's it.
- No Tailwind. No frameworks. No libraries. No bundlers or build processes. No NPM. No React.
- State persists in `localStorage`. Data comes from static JSON files.
- This should feel instant — no skeleton screens, no loading spinners.

## Design Direction

A blend of:
- **Vercel/shadcn cleanliness** — sharp borders, generous whitespace, no unnecessary decoration
- **Editorial warmth** — serif headings, generous line height, content-first
- **Matter app** (hq.getmatter.com) — TTS bar, highlighting, reading focus, clean hierarchy
- **Alex's mockups** — subscription carousel, card-based discovery, social notes with inline media, Following feed with mixed content types

### Design Principles

- **Calm over stimulating** — completion states, muted palette, generous whitespace
- **Content is the hero** — minimal chrome, beautiful typography, full-bleed images
- **Desktop-first, responsive** — looks great at all breakpoints
- **Light + dark mode baked in from the start**
- **Transparency as trust** — show why content is recommended, let users adjust
- **No dark patterns** — no streak anxiety, no guilt, warm welcome-back regardless of absence
- **Accessibility first** — font size, density controls throughout (per Veselin's feedback)

### Things to Avoid

- No gradient backgrounds
- No heavy drop shadows
- No card borders everywhere (use subtle separators instead)
- No generic icons (each should be purpose-drawn SVG)
- No skeleton screens that feel like a loading app

## Navigation (5 Tabs)

### 1. Home — Personalized reading hub
- Subscription carousel with unread badges + pinnable custom feed cards with per-feed tuning knobs
- Sub-tabs: **Recent** (inbox-style, primary), **For You** (algorithmic), **Saved** (queue)
- "Done for now" calm completion state — no infinite scroll, no guilt
- Vertical article swiping for seamless reading without returning to the feed
- Smart Lists / power-user custom tabs
- Feed tuning: frequency knob, content type filter, sort (chrono / quality / surprise me)

### 2. Discover — Curated magazine, not a social feed
- Hero carousel: "For You" personalized picks
- Freshly Pressed (editorial curation — WordPress's signature)
- Trending (quality-gated via "calm viral" exposure model: 10 → 50 → 200 → trending)
- Rising Voices (new creators, <500 subs, high engagement ratio)
- "Because You Read [X]" collaborative filtering
- Featured Author Spotlight
- Topic Clusters (visual bubbles, browseable)
- Daily Prompt + community responses
- Regional/language sections
- Quality signals: read completion & saves > likes > bounce; anti-signal for outrage patterns
- Badges for creators who get featured
- Push notifications for top "For You" picks (standalone app only)

### 3. Following / Social — Algorithm-free trusted circle
- Content only from people you follow — no stranger suggestions
- Social Notes (short-form)
- Comments on articles (with article context), reposts with commentary, recommendations
- Daily prompt responses from your network
- Inline media: full-width images, horizontal galleries, inline video, compact podcast players
- Future: per-site discussion boards, Bluesky-style Starter Packs, Circles / micro-communities

### 4. Saved — Reading queue, library & audio
- Drag-to-reorder queue with estimated read time
- Full library with full-text search, tags (user + AI-suggested), collections, highlights & notes
- One-tap text-to-speech, multiple voice options, adjustable speed
- Listening queue as persistent playlist
- Background playback + lock screen controls
- History with "Revisit" suggestions (articles read 30+ days ago)
- Note: most users may treat Saved like archive — lean on Recent/Inbox as primary

### 5. You / Me — Profile, settings & creation
- Reading stats, streaks, public reading list (optional)
- Your blogs on WordPress.com + Fediverse identity
- Quick Post (compose a Note or full post)
- Algorithm transparency with adjustment knobs
- "Go invisible" mode
- Calm Mode notifications (batch to 2x/day)
- Content filters: language, region, topic muting, sensitivity
- Import: OPML, Substack, Feedly, Mastodon/Fediverse
- Data export, privacy controls

## Onboarding (60-second AI-powered flow)

- Conversational chat-style: "What are you into? Not the polished version — the weird, specific stuff."
- AI matches against WordPress content graph → shows 8-10 blog cards
- Import from Substack / Feedly / OPML / Fediverse
- Pick your vibe: reading density, font, theme
- Drop into a pre-populated Home — no cold start

## Strategic Context

- **Ownership is WordPress DNA** — no 10% platform fee, creators keep what they earn
- Pocket is dead. Omnivore is dead. Artifact is dead. Market wide open.
- 43% of the web runs on WordPress — we have the content, just need to surface it
- Fediverse-ready via ActivityPub
- Standalone app creates marketing moment + first-class reading experience
- **Flywheel:** More readers → more value for creators → more creators choose WP → more content → more readers

## What "Clickable Prototype" Means

- Every button and link should **do something** — navigate, toggle state, show/hide UI
- Data should feel real (realistic titles, excerpts, author names)
- State persists in `localStorage` so refreshing doesn't reset everything
- Fully demo-able end-to-end
