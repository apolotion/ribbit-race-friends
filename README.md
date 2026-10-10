# Ribbit Race Friends Edition

Build: `2026.10.10-friends-label-collision-polish-1`  
Displayed game version: `VERSION 1.2.0`

This is the independent public Cloudflare Friends Edition. It retains four-digit PIN accounts, cloud saves, private rooms, Quickplay, spectators, CPU takeover, the current 15-word Spanish vocabulary, clean sign-out reloads, stable word-label placement, and the modular browser-client organization.

## Changes in this release

- **All labels above flies:** fly vocabulary plates no longer use below-fly or side candidates.
- **Stable text rendering:** each fly keeps one placement and one prerendered plate for its lifetime, reducing Solo and online jitter.
- **Achievement glyph:** the bitmap font now supports `#`, so `NEW FRIENDS #1!` renders correctly.
- **Local PvP discoverability:** hovering over the center CPU/VS toggle explains that it enables Local PvP.
- **Deterministic frog contact:** horizontal overlap causes a rebound; vertical overlap causes a bonk. Collision cooldowns separate embedded frogs instead of allowing phasing.
- **High-speed collision protection:** swept collision detection catches frogs that cross between fixed-physics frames.
- **Visible version:** `VERSION 1.2.0` appears in Solo Settings, Versus Settings, and Pause.

## Repository map

| Path | Responsibility |
|---|---|
| `public/index.html` | Accessible document structure and login/game markup |
| `public/styles/` | Base, cloud UI, fullscreen, queue rail, and responsive presentation |
| `public/scripts/friends-api-client.js` | HTTP requests, timeouts, and server errors |
| `public/scripts/auth-screen-controller.js` | Login/game boundary and clean sign-out reload |
| `public/scripts/cloud-client.js` | Accounts, save hydration, vocabulary, leaderboard, cloud lifecycle |
| `client/game/10-core-config.js` | Core configuration, levels, achievements, and display version |
| `client/game/20-models-and-state.js` | Runtime models and shared state |
| `client/game/30-online-versus.js` | Rooms, Quickplay, spectators, CPU takeover, online synchronization |
| `client/game/40-ui-navigation-audio.js` | Menus, navigation, settings, records, audio |
| `client/game/50-solo-gameplay.js` | Single Player physics, flies, and round lifecycle |
| `client/game/60-versus-gameplay.js` | Local Versus rules, CPU, collision classification, match lifecycle |
| `client/game/70-rendering.js` | Text, sprites, word-plate caching, menus, HUD |
| `client/game/80-input-loop-startup.js` | Scene composition, frozen pause frame, input, animation loop, startup |
| `scripts/build-game.mjs` | Validates and assembles the closure-preserving game bundle |
| `public/scripts/game.bundle.js` | Generated runtime; do not edit directly |
| `src/` | Cloudflare Worker, Durable Objects, saves, rooms, and vocabulary |

## Development

Use Node 22 or newer:

```bash
npm install
npm run build
npm run check
npm test
```

Cloudflare build settings remain:

```text
Build command:  npm run check && npm test
Deploy command: npx wrangler deploy
```

Keep the existing Worker and its `FriendsHub`, `FriendsRoom`, and `ASSETS` bindings. No database migration or account reset is required.
