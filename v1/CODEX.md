# Longform — Codex Working Guide

This file is an adapted copy of `CLAUDE.md`, optimized for implementation work.

## Mission
Build a clickable, high-fidelity HTML prototype of the future WordPress.com reading experience (Longform). It is a vision demo, not a near-term scoped release.

## Hard Constraints
- Stack: `HTML + CSS + vanilla JS + JSON` only.
- No frameworks, libraries, build tools, or package managers.
- Persist UI/app state with `localStorage`.
- Use static JSON as data sources.
- Interactions should feel instant; avoid loading patterns.

## Prototype Bar
The prototype should support an end-to-end demo across all 5 tabs:
1. Browse each tab and sub-surface.
2. Open and read an article.
3. Save/unsave content.
4. See saved items reflected in Saved.
5. Toggle light/dark mode with persistent state.

Every visible control should do something meaningful (navigation, state change, reveal, filter, reorder, etc.).

## Product Shape
### 1. Home
- Subscription carousel, unread indicators, pinnable feed cards.
- Sub-tabs: Recent, For You, Saved.
- Calm completion state ("Done for now").
- Vertical article swiping.
- Feed tuning controls (frequency, type, sort).

### 2. Discover
- Curated/editorial feel, not social noise.
- Hero personalized picks, Freshly Pressed, Trending, Rising Voices.
- Recommendation explainability ("Because you read...").
- Topic clusters and browseable sections.

### 3. Following/Social
- Only followed people.
- Social Notes, comments with context, reposts with commentary.
- Mixed inline media modules.

### 4. Saved
- Queue + library model.
- Reordering, tags/collections, highlights/notes.
- TTS controls and listening queue.
- History/revisit affordances.

### 5. You/Me
- Profile/settings/creation hub.
- Transparency controls for recommendations.
- Privacy + data controls.
- Quick Post entry points.

## Design Intent
- Clean and editorial: quiet UI, content-first typography.
- Calm over stimulating.
- Minimal chrome, generous whitespace.
- Light and dark mode from day one.
- Accessibility controls (font size/density).

### Avoid
- Gradient backgrounds.
- Heavy shadows.
- Border-heavy card grids.
- Generic-looking icons.
- Skeleton/loading placeholders.

## Implementation Priorities
1. Functional navigation and page state.
2. Realistic mock data and content density.
3. Persistent user actions (save/read/view settings).
4. Reading experience quality (typography, spacing, media blocks).
5. Discoverability and recommendation explanations.

## State Model (Minimum)
Track these in `localStorage`:
- Theme mode.
- Saved article IDs.
- Recently viewed/read IDs.
- Active tab/sub-tab.
- User display prefs (font size, density).
- Optional: feed tuning settings.

## Definition of Done for Changes
- UI change is visible and interactive.
- State survives refresh if user-affecting.
- No dead controls introduced.
- Works in desktop and mobile widths.
- No framework/tooling creep.

## Strategic Context to Preserve
- WordPress ownership model and creator economics are differentiators.
- The opportunity is a high-quality, trustworthy reading product.
- This prototype should communicate product confidence and coherence.
