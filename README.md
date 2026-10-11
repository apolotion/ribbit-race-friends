# Ribbit Race Friends Edition

Build: `2026.10.10-friends-centered-labels-themed-book-1`  
Displayed game version: `VERSION 1.4.1`

This is the independent public Cloudflare Friends Edition. It retains four-digit PIN accounts, cloud saves, private rooms, Quickplay, spectators, CPU takeover, replay-enabled Fastest Time/Fewest Jumps records, post-unlock hat progression, Mobile Mode, the current 15-word Spanish vocabulary, clean sign-out reloads, and the modular browser-client organization.

## Changes in 1.4.1

- **Exact fly-label centering:** every vocabulary plate is anchored at `flyCenterX - plateWidth / 2`. Labels no longer shift left or right to avoid the timer, score HUD, pause button, or another label. If labels conflict, only the vertical row may change.
- **Translucent pause control:** the running pause button is rendered at 56% opacity so a centered answer remains visible underneath it. Paused and Sandbox states use slightly stronger opacity.
- **Frog-themed instruction book:** the pause-menu book button, its cover, pages, spine, page lines, bookmark, How To Play header, and version footer inherit the currently selected default or custom frog palette.
- **Replay backend completion:** record replays are stored in the existing `FriendsHub` SQLite Durable Object and are served through same-origin replay routes. No new database binding is required.
- **Permanent cheat removal repair:** the old permanent unlock sequence remains disabled; `playtest` is the only reversible preview code.

## Repository map

| Path | Responsibility |
|---|---|
| `public/index.html` | Accessible document structure and login/game markup |
| `public/styles/` | Base, cloud UI, fullscreen, queue rail, mobile/replay presentation |
| `public/scripts/friends-api-client.js` | HTTP requests, timeouts, and server errors |
| `public/scripts/auth-screen-controller.js` | Login/game boundary and clean sign-out reload |
| `public/scripts/cloud-client.js` | Accounts, save hydration, vocabulary, leaderboard, cloud lifecycle |
| `public/scripts/extended-features.js` | Mobile controls, replays, palettes, world-record notices, hat progression |
| `client/game/10-core-config.js` | Core configuration, levels, achievements, credit, and display version |
| `client/game/20-models-and-state.js` | Runtime models, sandbox state, and shared state |
| `client/game/30-online-versus.js` | Rooms, Quickplay, spectators, CPU takeover, online synchronization |
| `client/game/40-ui-navigation-audio.js` | Menus, navigation, settings, records, audio, and Custom Frog geometry |
| `client/game/50-solo-gameplay.js` | Single Player physics, flies, sandbox animation, and round lifecycle |
| `client/game/60-versus-gameplay.js` | Local Versus rules, CPU, collision classification, match lifecycle |
| `client/game/70-rendering.js` | Text, fly plates, themed book, cinematics, achievements, menus, HUD |
| `client/game/80-input-loop-startup.js` | Scene composition, frozen pause frame, input, animation loop, startup |
| `client/game/90-extended-features.js` | Runtime bridge, telemetry, palette hooks, mobile/replay integration |
| `scripts/build-game.mjs` | Validates and assembles the closure-preserving game bundle |
| `public/scripts/game.bundle.js` | Generated runtime; do not edit directly |
| `src/` | Cloudflare Worker, Durable Objects, saves, rooms, replay storage, vocabulary |

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

Keep the existing Worker and its `FriendsHub`, `FriendsRoom`, and `ASSETS` bindings. The replay table is created automatically inside the existing FriendsHub SQLite database. No account reset or new Durable Object is required.
