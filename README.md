# Ribbit Race Friends Edition

Build: `2026.10.10-friends-visual-polish-1`
Displayed game version: `VERSION 1.3.0`

This is the independent public Cloudflare Friends Edition. It retains four-digit PIN accounts, cloud saves, private rooms, Quickplay, spectators, CPU takeover, the current 15-word Spanish vocabulary, clean sign-out reloads, stable word-label placement, and the modular browser-client organization.

## Changes in this release

- **Achievement visibility:** achievement toasts are capped at 62% opacity when a fly or vocabulary plate is behind them.
- **Jungle cleanup:** the decorative snake around the center tree was removed.
- **Final Catch polish:** vocabulary plates remain attached to their flies during the cinematic camera move and fade away with the action.
- **Clearer Friends notice:** the former `NEW FRIENDS #1!` message is now `FRIENDS LEADER!`. It means the player reached or tied first place on a Friends leaderboard metric.
- **Leaderboard grammar:** PvP results display `1 WIN` and use `WINS` for every other total.
- **Consistent credit:** the main and Single Player menus share one `MADE BY NICK` baseline.
- **Centered labels:** fly-label text is centered in physical pixels, including Lake labels near the screen edges.
- **Pause help:** the version moved into the footer of the redesigned How To Play book panel.
- **Custom Frog editor:** a larger live preview mirrors the normal Frog Color layout while the RGB controls remain grouped on the right.
- **Sandbox animation:** sandbox flies begin at spawn age zero and use the same grow-and-spark animation as normal Single Player flies.
- **Retired public migration:** the public old-private-key migration button and form are removed; owner recovery remains server-side.

## Repository map

| Path | Responsibility |
|---|---|
| `public/index.html` | Accessible document structure and login/game markup |
| `public/styles/` | Base, cloud UI, fullscreen, queue rail, and responsive presentation |
| `public/scripts/friends-api-client.js` | HTTP requests, timeouts, and server errors |
| `public/scripts/auth-screen-controller.js` | Login/game boundary and clean sign-out reload |
| `public/scripts/cloud-client.js` | Accounts, save hydration, vocabulary, leaderboard, cloud lifecycle |
| `client/game/10-core-config.js` | Core configuration, levels, achievements, credit, and display version |
| `client/game/20-models-and-state.js` | Runtime models, sandbox state, and shared state |
| `client/game/30-online-versus.js` | Rooms, Quickplay, spectators, CPU takeover, online synchronization |
| `client/game/40-ui-navigation-audio.js` | Menus, navigation, settings, records, audio, and Custom Frog geometry |
| `client/game/50-solo-gameplay.js` | Single Player physics, flies, sandbox animation, and round lifecycle |
| `client/game/60-versus-gameplay.js` | Local Versus rules, CPU, collision classification, match lifecycle |
| `client/game/70-rendering.js` | Text, sprites, labels, cinematics, achievements, menus, HUD |
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
