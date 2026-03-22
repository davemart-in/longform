# Longform

Longform is a high-fidelity reader prototype for a future WordPress.com reading experience. The current implementation lives in [`v1/`](/Users/davem/Sites/longform/v1) and is built as a static app using HTML, CSS, vanilla JavaScript, and JSON fixture data.

## What This Repo Contains

- A clickable prototype focused on reading, discovery, saving, and personalization.
- A static frontend with no build step and no package manager.
- Mock data sources for posts, sites, user profile data, discovery content, and rooms.
- A small local server helper for running the prototype during development.

## Current Prototype

The active prototype is in [`v1/`](/Users/davem/Sites/longform/v1).

Key surfaces include:

- `Home`: followed-site feed, subscription filtering, and customizable feeds.
- `Discover`: editorial recommendations, hero content, prompts, trending posts, and suggested sites.
- `Rooms`: browse and join “Living Rooms” around topics and communities.
- `Saved`: reading queue, highlights, history, and listening controls.
- `You`: profile, reading stats, subscriptions, lists, and reader preferences.
- `Article view`: immersive reading with typography controls, highlighting, and saved-state interactions.

The app uses hash-based routing and persists reader state in `localStorage`.

## Tech Constraints

- HTML, CSS, vanilla JS, and JSON only
- No frameworks or build tools
- State persisted in `localStorage`
- Data loaded from static JSON files in [`v1/data/`](/Users/davem/Sites/longform/v1/data)

## Run Locally

Clone the repo and enter the project directory:

```bash
git clone git@github.com:davemart-in/longform.git
cd longform
```

Then start the prototype:

```bash
cd v1
./start.sh
```

This starts PHP's built-in server on `http://localhost:8100` by default.

To use a different port:

```bash
cd v1
./start.sh 3000
```

You can also serve [`v1/`](/Users/davem/Sites/longform/v1) with any other simple static server, but the included script is the fastest way to run the prototype locally.

## Repo Layout

```text
.
├── README.md
└── v1
    ├── index.html
    ├── start.sh
    ├── assets/
    ├── css/
    ├── data/
    └── js/
```

## Notable Implementation Details

- App entrypoint: [`v1/js/app.js`](/Users/davem/Sites/longform/v1/js/app.js)
- State and persistence: [`v1/js/store.js`](/Users/davem/Sites/longform/v1/js/store.js)
- Routing: [`v1/js/router.js`](/Users/davem/Sites/longform/v1/js/router.js)
- Static fixture data: [`v1/data/posts.json`](/Users/davem/Sites/longform/v1/data/posts.json), [`v1/data/sites.json`](/Users/davem/Sites/longform/v1/data/sites.json), [`v1/data/user.json`](/Users/davem/Sites/longform/v1/data/user.json), [`v1/data/discover.json`](/Users/davem/Sites/longform/v1/data/discover.json), [`v1/data/rooms.json`](/Users/davem/Sites/longform/v1/data/rooms.json)

Persisted state currently includes things like:

- saved posts
- reading history
- likes and follows
- joined rooms
- highlights
- theme and reading preferences

## Working Notes

Internal working guides for implementation live in [`v1/CODEX.md`](/Users/davem/Sites/longform/v1/CODEX.md) and [`v1/CLAUDE.md`](/Users/davem/Sites/longform/v1/CLAUDE.md).
