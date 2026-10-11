# Ribbit Race Friends Edition

Build: `2026.10.11-friends-tutorial-spectator-polish-1`  
Displayed game version: `VERSION 1.7.0`

This is the independent public Cloudflare Friends Edition. It retains four-digit PIN accounts, cloud saves, private rooms, Quickplay, spectators, CPU takeover, leaderboard record replays, post-unlock hat progression, the current 15-word Spanish vocabulary, clean sign-out reloads, stable fly labels, and the responsibility-based browser-client organization.

## Changes in 1.6.0

### iPhone Home Screen support

- Added a web-app manifest, Apple mobile-web-app metadata, 180px and 512px icons, landscape orientation, safe-area support, and `100dvh` layout.
- Added **PLAYING ON MOBILE?** to the login page with Safari **Add to Home Screen** directions.
- Enabling Mobile Mode repeats the installation directions.

### Main-menu mobile/account controls

- Replaced the old text Mobile Mode control with canvas-native account and phone/computer buttons.
- The device button confirms **Turn on Mobile Mode?** or **Turn on Computer Mode?** before changing controls.
- The account/avatar button opens cloud save, leaderboard, record, and sign-out controls.
- The old guest/fullscreen corner toolbar is hidden while Mobile Mode is active.

### Reliable touch gameplay

- Added an upper-right touch pause button during Versus.
- Added letterbox-aware touch-coordinate mapping.
- Added gradient hold-and-release jump meters for Single Player and Versus.
- Human Local Versus uses separate pointer ownership for P1 and P2, allowing both students to hold their jump controls simultaneously.
- Online Versus exposes only the local player's touch meter.
- Suppressed iOS long-press selection, callouts, dragging, context menus, and magnifier gestures on the game canvas.
- Mobile instruction bubbles use tap/jump-meter language and fade when a fly or opponent frog is behind them.

### Mobile performance

- Coarse-touch devices render the pixel canvas at `960×540` rather than `1920×1080`.
- Automatic canvas replay recording is disabled on mobile.
- Palette, replay, hat, and runtime monitors are throttled instead of running independent full-speed animation loops.
- Physics catch-up work is capped after a slow frame to prevent a feedback loop of increasingly expensive frames.

### Versus and hats

- Versus round results use a single award token and enter a real celebration/result state rather than accidentally pausing or awarding twice.
- PvP achievement credit can apply to either eligible active human slot.
- Vertical bonks require valid falling/rising motion; invalid close-range vertical contact rebounds.
- `hatstest` exposes the Hats feature only.
- Hat requirements no longer depend on an online or human opponent and use more default frog skins.
- The no-hat icon is a dashed empty top-hat outline.

## Repository map

| Path | Responsibility |
|---|---|
| `public/index.html` | Accessible login, game-shell, mobile-help, leaderboard, and account markup |
| `public/manifest.webmanifest` | Home Screen/PWA name, icons, landscape orientation, and standalone display |
| `public/icons/` | iPhone/Home Screen app icons |
| `public/styles/` | Base, cloud, game-shell, mobile, replay, and safe-area presentation |
| `public/scripts/friends-api-client.js` | HTTP requests, request timeouts, and server errors |
| `public/scripts/auth-screen-controller.js` | Login/game boundary and clean sign-out reload |
| `public/scripts/cloud-client.js` | PIN accounts, saves, vocabulary, leaderboard, and cloud lifecycle |
| `public/scripts/mobile-experience.js` | Mobile/Computer confirmation, install help, native-gesture suppression, account bridge |
| `public/scripts/extended-features.js` | Replays, palette tools, world-record notices, and hat progression |
| `client/game/10-core-config.js` | Core configuration, levels, achievements, credit, and display version |
| `client/game/20-models-and-state.js` | Runtime models, sandbox state, and shared state |
| `client/game/30-online-versus.js` | Rooms, Quickplay, spectators, CPU takeover, online synchronization |
| `client/game/40-ui-navigation-audio.js` | Menus, navigation, settings, records, audio, and Custom Frog geometry |
| `client/game/50-solo-gameplay.js` | Single Player physics, flies, Sandbox animation, and round lifecycle |
| `client/game/60-versus-gameplay.js` | Local Versus rules, CPU, collision classification, and match lifecycle |
| `client/game/70-rendering.js` | Fly plates, themed book, cinematics, achievements, menus, and HUD |
| `client/game/80-input-loop-startup.js` | Scene composition, input, fixed-step loop, and startup |
| `client/game/90-extended-features.js` | Runtime bridge, record hooks, palette hooks, and telemetry |
| `client/game/100-mobile-experience.js` | Canvas-native account/device icons, mobile meters, pause touch, and pointer ownership |
| `scripts/build-game.mjs` | Validates and assembles the closure-preserving game bundle |
| `public/scripts/game.bundle.js` | Generated runtime; do not edit directly |
| `src/` | Cloudflare Worker, Durable Objects, saves, rooms, replay storage, and vocabulary |

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

Keep the existing Worker and its `FriendsHub`, `FriendsRoom`, and `ASSETS` bindings. No account reset or new database is required.
